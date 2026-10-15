# Blog API (CRUD)

A full-stack blog management application with REST API endpoints, JWT authentication, and MongoDB persistence. Users can register, log in, and create, read, update, and delete their own blog posts through a responsive React interface.

## Features

- User registration and login
- Password hashing with bcrypt
- JWT-based authentication
- Create, read, update, and delete blog posts
- MongoDB data persistence
- User-specific blog ownership and access protection
- Search blogs by title or content
- Responsive interface for desktop and mobile

## Tech Stack

**Frontend:** React, Vite, CSS

**Backend:** Node.js, Express.js

**Database:** MongoDB, Mongoose

**Authentication:** JSON Web Tokens (JWT), bcrypt

## Project Structure

- `backend/` — REST API, authentication, database models, and routes
- `frontend/` — React user interface

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/pashma-abdulmajeed/blog-api-crud-project.git
cd blog-api-crud-project
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file using `backend/.env.example` as a reference. Add your MongoDB connection string and a strong JWT secret.

Start the backend:

```bash
npm run dev
```

### 3. Configure the frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env` using `frontend/.env.example` as a reference. Set `VITE_API_URL` to your backend URL.

Start the frontend:

```bash
npm run dev
```

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/blogs` | Create a blog |
| GET | `/api/blogs` | List the current user's blogs |
| GET | `/api/blogs/:id` | Get one blog |
| PUT | `/api/blogs/:id` | Update a blog |
| DELETE | `/api/blogs/:id` | Delete a blog |

Blog endpoints require a valid Bearer token.

## Environment Variables

**Backend:** `PORT`, `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`

**Frontend:** `VITE_API_URL`

Never commit actual `.env` files, credentials, or secrets to GitHub.

## Future Improvements

- Public blog pages and categories
- Pagination and sorting
- Rich text editor
- User profile and avatar
- Automated API tests

## Author

Built as a full-stack development portfolio project.
