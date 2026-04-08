const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const router   = express.Router();
const { protect, restrictTo } = require('../middleware/auth');

// ─── Storage destination ──────────────────────────────────────────────────────
// Videos are saved to frontend/public/videos/{movies|shows}/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.query.folder === 'shows' ? 'shows' : 'movies';
    // Go up from backend/src/routes → backend → kflix-out → frontend/public/videos/
    const dest = path.join(__dirname, '..', '..', '..', 'frontend', 'public', 'videos', folder);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Keep original name but sanitize spaces → hyphens
    const safe = file.originalname.replace(/\s+/g, '-');
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB max
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|webm|mkv|avi|mov/i;
    if (allowed.test(path.extname(file.originalname))) return cb(null, true);
    cb(new Error('Only video files are allowed (mp4, webm, mkv, avi, mov)'));
  },
});

// POST /api/upload/video?folder=movies  (admin only)
router.post(
  '/video',
  protect,
  restrictTo('admin'),
  upload.single('video'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const folder   = req.query.folder === 'shows' ? 'shows' : 'movies';
    const safeName = req.file.filename;
    const videoPath = `/videos/${folder}/${safeName}`;
    res.json({ success: true, path: videoPath, filename: safeName });
  }
);

module.exports = router;
