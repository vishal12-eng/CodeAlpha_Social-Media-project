# CodeAlpha_Social-Media-project
A full-stack Social Media Platform built using HTML, CSS, JavaScript, Node.js, Express.js, and MongoDB. Features include user authentication, user profiles, posts, comments, likes, follow/unfollow system, and personalized feed. Developed for the CodeAlpha Full Stack Development Internship.

Production-ready full-stack social media platform built with:

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Authentication: JWT + bcryptjs

## Folder Structure

```text
CodeAlpha_SocialMedia/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── commentController.js
│   │   ├── followController.js
│   │   ├── postController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── Comment.js
│   │   ├── Post.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── followRoutes.js
│   │   ├── postRoutes.js
│   │   └── userRoutes.js
│   ├── utils/
│   │   └── asyncHandler.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
└── frontend/
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── auth.js
    │   ├── feed.js
    │   ├── post.js
    │   └── profile.js
    ├── feed.html
    ├── index.html
    ├── login.html
    ├── post.html
    ├── profile.html
    ├── register.html
    └── user.html
```

## Features

- Register, login, logout, and JWT-protected routes
- Profile creation and profile updates with bio and profile picture
- Followers and following system
- Post create, edit, delete, like, and unlike
- Comment add and delete
- Home feed from followed users
- Latest posts and user profile feeds
- Notifications for likes, comments, and follows
- User search, trending posts, and suggested users

## Setup

1. Open a terminal in `CodeAlpha_SocialMedia/backend`
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and update the values
4. Start the development server:

```bash
npm run dev
```

The app runs at:

- Frontend: `http://localhost:5000`
- API: `http://localhost:5000/api`

## Main API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Users

- `GET /api/users/profile`
- `PUT /api/users/profile`
- `GET /api/users/search?q=keyword`
- `GET /api/users/suggested`
- `GET /api/users/:id`

### Posts

- `POST /api/posts`
- `GET /api/posts`
- `GET /api/posts/feed/home`
- `GET /api/posts/trending/list`
- `PUT /api/posts/:id`
- `DELETE /api/posts/:id`
- `PUT /api/posts/like/:id`

### Comments

- `POST /api/comments/:postId`
- `DELETE /api/comments/:id`

### Follow

- `PUT /api/follow/:userId`
- `PUT /api/unfollow/:userId`

## Deployment

Deploy as a single Node service on Render, Railway, Cyclic, or a VPS:

1. Set the root directory to `CodeAlpha_SocialMedia/backend`
2. Add environment variables from `.env.example`
3. Build command:

```bash
npm install
```

4. Start command:

```bash
npm start
```

The backend serves the static frontend from `../frontend`, so one deployment is enough for the complete app.
