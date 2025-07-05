# Blog Hoster - Blogging Platform

**Blog Hoster** is a full-stack web application that allows users to register, log in,
create blog posts, edit or delete their own posts, like others' posts, 
and view a list of all public blogs. The application is built using Node.js, Express, PostgreSQL, and EJS.

---

## Features

- User authentication (registration, login, logout)
- Create, edit, and delete blog posts
- Like and unlike posts
- View all public blog posts
- Dashboard with user's personal posts
- Profile page with user information
- Session-based authentication with `express-session`
- PostgreSQL for persistent data storage

---

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Templating Engine**: EJS
- **Authentication**: bcrypt, express-session
- **Database Driver**: pg
- **Deployment**: Render

---

## Folder Structure

/project-root
├── public/ # Static files (CSS, images)
├── views/ # EJS templates
├── index.js # Main server file
├── package.json
└── .env 


---

## Getting Started

### 1. Clone the Repository
bash
git clone https://github.com/i-Preet/Blog-Hoster
cd bloghoster

### 2. Install Dependencies
npm install

### 3. Set up Environment Variables
DATABASE_USER=your_db_user
DATABASE_HOST=your_db_host
DATABASE_NAME=your_db_name
DATABASE_PASSWORD=your_db_password
DATABASE_PORT=5432
SESSION_SECRET=your_session_secret
PORT=3000

### 4.Start the server
node index.js
Visit http://localhost:3000

## Live Deployment
You can view the deployed application at:
[Blog Hoster](https://bloghoster.onrender.com)

## Screenshots

Landing Page
![image](https://github.com/user-attachments/assets/b10f2eda-753b-4feb-a86b-1938799ce388)

All Posts
![image](https://github.com/user-attachments/assets/99df0309-0619-496c-9e1c-931781c3e99b)

Personal Dashboard
![image](https://github.com/user-attachments/assets/b05024ed-5213-46c9-a4a5-5f41268c47d5)

Write and Post your Blog
![image](https://github.com/user-attachments/assets/a457a6be-6115-4963-9789-11bcf3384d12)


## Future Improvements
Comment system
Image upload support for posts
Post search and filtering by tags
Pagination for large post lists
Dark/light theme toggle

## Author
Preeti Mondal
For any inquiries, please contact via [LinkedIn](https://www.linkedin.com/in/preeti-mondal-696057366?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app).

