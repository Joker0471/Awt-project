require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const connectDB    = require('./config/db');

const authRoutes   = require('./routes/authRoutes');
const mediaRoutes  = require('./routes/mediaRoutes');
const userRoutes   = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { errorHandler, notFound } = require('./middleware/error');

// ─── Connect DB ───────────────────────────────────────────────────────────────
connectDB();

const app = express();

// ─── Core Middleware ──────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.CLIENT_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// Add default dev origins if not already present
['http://localhost:5173','http://localhost:5174','http://localhost:5175'].forEach(o => {
  if (!ALLOWED_ORIGINS.includes(o)) ALLOWED_ORIGINS.push(o);
});

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, mobile apps, same-origin)
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,   // allows cookies (refresh token)
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',   authRoutes);
app.use('/api/media',  mediaRoutes);
app.use('/api/users',  userRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'KFLIX API is running 🎬' });
});

// ─── Error Handlers ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀  KFLIX backend running on http://localhost:${PORT}`);
  console.log(`✅  CORS allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
