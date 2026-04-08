const Media = require('../models/Media');

// ─── @GET /api/media ─────────────────────────────────────────────────────────
// Query params: type, platform, page, limit, search

exports.getAllMedia = async (req, res, next) => {
  try {
    const { type, platform, search, page = 1, limit = 20 } = req.query;

    // Only admins can see inactive media
    const isAdmin = req.user && req.user.role === 'admin';
    const filter = {};
    if (!isAdmin) filter.status = 'Active';
    if (type)     filter.type     = type;
    if (platform) filter.platform = platform.toUpperCase();
    if (search)   filter.$text    = { $search: search };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Media.countDocuments(filter);
    const items = await Media.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page:    Number(page),
      pages:   Math.ceil(total / Number(limit)),
      data:    items,
    });
  } catch (err) {
    next(err);
  }
};

// ─── @GET /api/media/grouped ──────────────────────────────────────────────────
// Returns { movies: { NETFLIX: [...], PRIME: [...] }, shows: { ... } }
// mirrors the shape your frontend data/data.js already uses

exports.getGrouped = async (req, res, next) => {
  try {
    const allMedia = await Media.find({ status: 'Active' });

    const grouped = { movies: {}, shows: {} };
    for (const item of allMedia) {
      const section = item.type === 'movie' ? 'movies' : 'shows';
      if (!grouped[section][item.platform]) grouped[section][item.platform] = [];
      grouped[section][item.platform].push(item);
    }

    res.status(200).json({ success: true, data: grouped });
  } catch (err) {
    next(err);
  }
};

// ─── @GET /api/media/:id ──────────────────────────────────────────────────────

exports.getMediaById = async (req, res, next) => {
  try {
    const item = await Media.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Media not found' });
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// ─── @POST /api/media  (admin only) ──────────────────────────────────────────

exports.createMedia = async (req, res, next) => {
  try {
    const item = await Media.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// ─── @PUT /api/media/:id  (admin only) ───────────────────────────────────────

exports.updateMedia = async (req, res, next) => {
  try {
    const item = await Media.findByIdAndUpdate(req.params.id, req.body, {
      new:              true,
      runValidators:    true,
    });
    if (!item) return res.status(404).json({ success: false, message: 'Media not found' });
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

// ─── @DELETE /api/media/:id  (admin only) ────────────────────────────────────

exports.deleteMedia = async (req, res, next) => {
  try {
    const item = await Media.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Media not found' });
    res.status(200).json({ success: true, message: 'Media deleted' });
  } catch (err) {
    next(err);
  }
};
