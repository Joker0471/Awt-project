# KFLIX Backend — Express + MongoDB + JWT

Complete REST API for the KFLIX streaming platform.

---

## Tech Stack

| Layer         | Library              |
|---------------|----------------------|
| Server        | Express 4            |
| Database      | MongoDB + Mongoose 8 |
| Auth          | JWT (access + refresh tokens) |
| Passwords     | bcryptjs (salt rounds: 12) |
| Environment   | dotenv               |

---

## Project Structure

```
kflix-backend/
├── src/
│   ├── config/
│   │   ├── db.js          # Mongoose connection
│   │   └── jwt.js         # Token helpers
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── mediaController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js        # protect + restrictTo
│   │   └── error.js       # global error handler
│   ├── models/
│   │   ├── User.js
│   │   └── Media.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── mediaRoutes.js
│   │   └── userRoutes.js
│   ├── seed.js            # one-time DB seed
│   └── server.js          # app entry point
├── frontend-integration/
│   ├── api.js             # drop into frontend src/api/auth.js
│   ├── LoginPage.jsx      # updated login page
│   └── SignupPage.jsx     # updated signup page
├── .env.example
├── .gitignore
└── package.json
```

---

## Quick Start

### 1. Install dependencies
```bash
cd kflix-backend
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env — set MONGO_URI, JWT secrets
```

### 3. Seed the database
```bash
node src/seed.js
```
This creates 3 default users and imports all movies/shows from the frontend data:

| Username | Password   | Role    |
|----------|------------|---------|
| admin    | admin123   | admin   |
| user     | kflix123   | user    |
| premium  | premium123 | premium |

### 4. Start the server
```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

Server runs on **http://localhost:5000**

---

## API Reference

### Auth  `/api/auth`

| Method | Endpoint              | Auth     | Description                  |
|--------|-----------------------|----------|------------------------------|
| POST   | `/signup`             | Public   | Register new user            |
| POST   | `/login`              | Public   | Login → access + refresh JWT |
| POST   | `/refresh`            | Cookie   | Rotate access token          |
| GET    | `/me`                 | 🔒 User  | Get logged-in user profile   |
| POST   | `/logout`             | 🔒 User  | Clear tokens                 |
| PUT    | `/change-password`    | 🔒 User  | Change own password          |

**Login / Signup response:**
```json
{
  "success": true,
  "accessToken": "<jwt>",
  "user": { "_id": "...", "username": "user", "role": "user", ... }
}
```

---

### Media  `/api/media`

| Method | Endpoint       | Auth       | Description                            |
|--------|----------------|------------|----------------------------------------|
| GET    | `/`            | Public     | List all media (filter, paginate)      |
| GET    | `/grouped`     | Public     | Grouped by type+platform (for UI rows) |
| GET    | `/:id`         | Public     | Single media item                      |
| POST   | `/`            | 🔒 Admin   | Create media                           |
| PUT    | `/:id`         | 🔒 Admin   | Update media                           |
| DELETE | `/:id`         | 🔒 Admin   | Delete media                           |

**Query params for `GET /api/media`:**
- `type` — `movie` or `show`
- `platform` — `NETFLIX`, `PRIME`, `MARVEL`, etc.
- `search` — full-text search on name/genre
- `page`, `limit` — pagination (default: page=1, limit=20)

**`GET /api/media/grouped` response (mirrors frontend data.js shape):**
```json
{
  "success": true,
  "data": {
    "movies": { "NETFLIX": [...], "PRIME": [...], ... },
    "shows":  { "NETFLIX": [...], "PRIME": [...], ... }
  }
}
```

---

### Users  `/api/users`

| Method | Endpoint                      | Auth       | Description             |
|--------|-------------------------------|------------|-------------------------|
| GET    | `/me/watchlist`               | 🔒 User    | Get watchlist           |
| POST   | `/me/watchlist`               | 🔒 User    | Add to watchlist        |
| DELETE | `/me/watchlist/:mediaId`      | 🔒 User    | Remove from watchlist   |
| GET    | `/stats`                      | 🔒 Admin   | User stats              |
| GET    | `/`                           | 🔒 Admin   | List all users          |
| GET    | `/:id`                        | 🔒 Admin   | Get user by ID          |
| PUT    | `/:id`                        | 🔒 Admin   | Update user role/status |
| DELETE | `/:id`                        | 🔒 Admin   | Delete user             |

---

## Auth Flow

```
Login → POST /api/auth/login
         ├── accessToken  (15 min) → stored in localStorage
         └── refreshToken (7 days) → stored in httpOnly cookie

Every request → Authorization: Bearer <accessToken>

Token expired → POST /api/auth/refresh (cookie sent automatically)
                └── new accessToken returned
```

---

## Frontend Integration

1. Copy `frontend-integration/api.js` → `project/src/api/auth.js`
2. Copy `frontend-integration/LoginPage.jsx`  → `project/src/pages/LoginPage.jsx`
3. Copy `frontend-integration/SignupPage.jsx` → `project/src/pages/SignupPage.jsx`
4. Add to `project/.env`:
   ```
   VITE_API_URL=http://localhost:5000
   ```

The updated pages are drop-in replacements — same UI, same CSS classes, now hitting the real API.

---

## Environment Variables

| Variable              | Default                          | Description                  |
|-----------------------|----------------------------------|------------------------------|
| `PORT`                | `5000`                           | Server port                  |
| `MONGO_URI`           | `mongodb://localhost:27017/kflix`| MongoDB connection string    |
| `JWT_ACCESS_SECRET`   | —                                | **Change in production!**    |
| `JWT_REFRESH_SECRET`  | —                                | **Change in production!**    |
| `JWT_ACCESS_EXPIRES`  | `15m`                            | Access token TTL             |
| `JWT_REFRESH_EXPIRES` | `7d`                             | Refresh token TTL            |
| `CLIENT_URL`          | `http://localhost:5173`          | CORS allowed origin          |
