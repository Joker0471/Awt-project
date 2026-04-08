# 🎬 KFLIX — Streaming Platform

A full-stack Netflix-style streaming platform built with **React + Vite** (frontend) and **Express + MongoDB + JWT** (backend).

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) **or** a MongoDB Atlas URI

### 2. Backend Setup

```bash
cd backend
npm install
# Edit .env with your MongoDB URI and JWT secrets
npm run dev       # starts on http://localhost:5000
```

#### Seed the database (optional but recommended)
```bash
node src/seed.js
```
This populates movies and shows. Creates default admin:
- **Username:** `admin` | **Password:** `admin123`

### 3. Frontend Setup

```bash
cd frontend
npm install
# .env is already configured for localhost:5000
npm run dev       # starts on http://localhost:5173
```

### 4. Open the app
- Frontend: http://localhost:5173
- Backend health: http://localhost:5000/api/health

---

## 🔐 Default Accounts (after seeding)

| Role  | Username | Password   |
|-------|----------|------------|
| Admin | admin    | admin123   |

Create new accounts via the **Sign Up** page.

---

## 🏗️ Architecture

```
kflix/
├── backend/
│   ├── src/
│   │   ├── config/       # DB + JWT helpers
│   │   ├── controllers/  # Auth, Media, Users
│   │   ├── middleware/   # protect, restrictTo, errorHandler
│   │   ├── models/       # User, Media (Mongoose)
│   │   ├── routes/       # authRoutes, mediaRoutes, userRoutes
│   │   ├── seed.js       # Database seeder
│   │   └── server.js     # Express app entry point
│   └── .env              # Environment variables
│
└── frontend/
    ├── src/
    │   ├── api/           # index.js — all API calls in one place
    │   ├── components/    # Navbar, MediaRow, Carousel
    │   ├── context/       # AuthContext (global auth state)
    │   ├── pages/         # HomePage, MoviesPage, SeriesPage, LoginPage, SignupPage
    │   ├── AdminDashboard.jsx
    │   └── App.jsx        # Routes + AuthProvider
    ├── .env               # VITE_API_URL
    └── vite.config.js     # Dev proxy → backend
```

---

## 🔧 Fixes Applied

| # | File | Fix |
|---|------|-----|
| 1 | `LoginPage.jsx` | Replaced hardcoded users with real `authAPI.login()` call |
| 2 | `SignupPage.jsx` | Connected to real `authAPI.signup()` with server error handling |
| 3 | `AdminDashboard.jsx` | Users now fetched from `usersAPI.getAll()`; CRUD uses `mediaAPI.create/update/delete` with MongoDB `_id` |
| 4 | `Navbar.jsx` | Logout calls `authAPI.logout()`; uses `AuthContext` |
| 5 | `App.jsx` | Added `AuthProvider`, `PublicRoute`, `AdminRoute` guards |
| 6 | `AuthContext.jsx` | Created — global login/logout/user state, session restore on refresh |
| 7 | `MediaRow.jsx` | Added `null` guard for undefined `items`; uses `AuthContext` |
| 8 | `Carousel.jsx` | Added `null/empty` guard; uses `AuthContext` |
| 9 | `vite.config.js` | Added `/api` proxy to backend (eliminates CORS issues in dev) |
| 10 | `frontend/.env` | Created with `VITE_API_URL` |
| 11 | `backend/.env` | Created from example |
| 12 | `backend/server.js` | Fixed CORS to properly handle array of origins with `credentials: true` |

---

## 📡 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| POST | `/api/auth/logout` | ✅ | Clears refresh token |
| GET  | `/api/auth/me` | ✅ | Current user profile |
| POST | `/api/auth/refresh` | cookie | Refresh access token |
| PUT  | `/api/auth/change-password` | ✅ | Change password |

### Media
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/media` | — | All media (paginated) |
| GET | `/api/media/grouped` | — | Grouped by type+platform |
| GET | `/api/media/:id` | — | Single media item |
| POST | `/api/media` | 🔒 Admin | Create media |
| PUT  | `/api/media/:id` | 🔒 Admin | Update media |
| DELETE | `/api/media/:id` | 🔒 Admin | Delete media |

### Users (Admin)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | 🔒 Admin | All users |
| GET | `/api/users/stats` | 🔒 Admin | User statistics |
| PUT | `/api/users/:id` | 🔒 Admin | Update user role/status |
| DELETE | `/api/users/:id` | 🔒 Admin | Delete user |

### Watchlist
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/me/watchlist` | ✅ | Get watchlist |
| POST | `/api/users/me/watchlist` | ✅ | Add to watchlist |
| DELETE | `/api/users/me/watchlist/:id` | ✅ | Remove from watchlist |
