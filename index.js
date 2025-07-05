
import dotenv from "dotenv";
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import bcrypt from 'bcrypt';
import pg from 'pg';

const app = express();
const PORT = 3000;
const db = new pg.Client({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
});

db.connect();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);


app.use((req, res, next) => {
  res.locals.loggedIn = !!req.session.userId;
  next();
});

function requireLogin(req, res, next) {
  if (req.session.userId) return next();
  res.redirect('/login');
}

// Home
app.get("/", async (req, res) => {
  const result = await db.query(`
    SELECT posts.*, users.name AS author_name, users.id AS author_id,
           COUNT(likes.id) AS like_count,
           BOOL_OR(likes.user_id = $1) AS liked_by_user
    FROM posts
    JOIN users ON posts.user_id = users.id
    LEFT JOIN likes ON posts.id = likes.post_id
    GROUP BY posts.id, users.id
    ORDER BY COUNT(likes.id) DESC, posts.created_at DESC
  `, [req.session.userId || 0]);
  
  let userName = null;

  if (req.session.userId) {
    const userResult = await db.query("SELECT name FROM users WHERE id = $1", [req.session.userId]);
    if (userResult.rows.length > 0) {
      userName = userResult.rows[0].name;
    }
  }

  res.render("index.ejs", {
    posts: result.rows,
    userName: userName,
    loggedIn: !!req.session.userId
  });  
});

// Dashboard - only user's posts
app.get('/dashboard', requireLogin, async (req, res) => {
  const result = await db.query('SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC', [req.session.userId]);
  const userResult = await db.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
  const user = userResult.rows[0];
  res.render('dashboard.ejs', {
    posts: result.rows,
    userId: req.session.userId,
    user,
    userName: user.name,
  });
  
});

// Register
app.get('/register', (req, res) => res.render('register.ejs'));

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  try {
    const result = await db.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      [name, email, hash]
    );
    req.session.userId = result.rows[0].id;
    res.redirect('/dashboard');
  } catch (err) {
    res.send('Error: ' + err.message);
  }
});

// Login
app.get('/login', (req, res) => res.render('login.ejs'));

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length > 0) {
    const valid = await bcrypt.compare(password, result.rows[0].password);
    if (valid) {
      req.session.userId = result.rows[0].id;
      return res.redirect('/dashboard');
    }
  }
  res.send('Invalid credentials');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Create Post
app.get('/postnew', requireLogin, async (req, res) => {
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
    const user = userResult.rows[0];
    res.render('postnew.ejs', { user, userName: user.name });
  });
  
app.post('/post', requireLogin, async (req, res) => {
  const { title, content } = req.body;
  await db.query(
    'INSERT INTO posts (title, content, user_id) VALUES ($1, $2, $3)',
    [title, content, req.session.userId]
  );
  res.redirect('/dashboard');
});

app.get('/profile', requireLogin, async (req, res) => {
  const userResult = await db.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
  const user = userResult.rows[0];

  const postsResult = await db.query('SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC', [req.session.userId]);

  res.render('profile.ejs', {
    user,
    posts: postsResult.rows,
    userName: user.name, 
  });
});


  
// Edit Post - Show edit form
app.get('/edit/:id', requireLogin, async (req, res) => {
  const result = await db.query(
    'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
    [req.params.id, req.session.userId]
  );

  if (result.rows.length === 0) return res.sendStatus(403);

  const userResult = await db.query('SELECT name FROM users WHERE id = $1', [req.session.userId]);
  const userName = userResult.rows[0].name;

  res.render('editpost.ejs', {
    post: result.rows[0],
    userName
  });
});

// Edit Post - Handle form submission
app.post('/edit/:id', requireLogin, async (req, res) => {
  const { title, content } = req.body;
  await db.query('UPDATE posts SET title = $1, content = $2, edited = true WHERE id = $3 AND user_id = $4', [
    title,
    content,
    req.params.id,
    req.session.userId
  ]);
  res.redirect('/dashboard');
});

// View All Posts of the present user
app.get('/post', requireLogin, async (req, res) => {
  const result = await db.query('SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC', [req.session.userId]);
  const userResult = await db.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
  const user = userResult.rows[0];
  res.render('posts.ejs', {
    posts: result.rows,
    userId: req.session.userId,
    user,
    userName: user.name  
  });
  
});

app.get('/user/:id', async (req, res) => {
  const authorId = req.params.id;
  const viewerId = req.session.userId || 0;

  try {
    // Get author's posts with like count and whether viewer has liked
    const postResult = await db.query(`
      SELECT posts.*, 
             COUNT(likes.id) AS like_count,
             BOOL_OR(likes.user_id = $1) AS liked_by_user
      FROM posts
      LEFT JOIN likes ON posts.id = likes.post_id
      WHERE posts.user_id = $2
      GROUP BY posts.id
      ORDER BY posts.created_at DESC
    `, [viewerId, authorId]);

    // Get author's name
    const authorResult = await db.query(`SELECT name FROM users WHERE id = $1`, [authorId]);
    if (authorResult.rows.length === 0) return res.status(404).send("User not found");
    const authorName = authorResult.rows[0].name;

    // If viewer is logged in, fetch their name
    let userName = null;
    if (req.session.userId) {
      const userRes = await db.query("SELECT name FROM users WHERE id = $1", [req.session.userId]);
      userName = userRes.rows.length > 0 ? userRes.rows[0].name : null;
    }

    // Render page
    res.render('user-posts.ejs', {
      posts: postResult.rows,
      authorName,
      loggedIn: !!req.session.userId,
      userName
    });
  } catch (err) {
    console.error("Error loading user profile:", err);
    res.status(500).send("Server error");
  }
});



app.post("/like", async (req, res) => {
  const userId = req.session.userId;
  const { postId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Login required" });
  }

  const existing = await db.query("SELECT * FROM likes WHERE user_id = $1 AND post_id = $2", [userId, postId]);

  if (existing.rows.length > 0) {
    await db.query("DELETE FROM likes WHERE user_id = $1 AND post_id = $2", [userId, postId]);
    res.json({ liked: false });
  } else {
    await db.query("INSERT INTO likes (user_id, post_id) VALUES ($1, $2)", [userId, postId]);
    res.json({ liked: true });
  }
});



// Delete Post
app.post('/delete/:id', requireLogin, async (req, res) => {
  await db.query('DELETE FROM posts WHERE id = $1 AND user_id = $2', [
    req.params.id,
    req.session.userId,
  ]);
  res.redirect('/dashboard');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
