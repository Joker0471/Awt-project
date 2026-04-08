const User  = require('../models/User');
const Media = require('../models/Media');

// ─── ADMIN: GET /api/users ────────────────────────────────────────────────────

exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status } = req.query;
    const filter = {};
    if (role)   filter.role   = role;
    if (status) filter.status = status;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      data:  users.map(u => u.toPublic()),
    });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN: GET /api/users/:id ────────────────────────────────────────────────

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user.toPublic() });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN: PUT /api/users/:id ────────────────────────────────────────────────
// Admins can update role / status. They cannot change passwords here.

exports.updateUser = async (req, res, next) => {
  try {
    const { role, status, username, email } = req.body;
    const allowed = {};
    if (role)     allowed.role     = role;
    if (status)   allowed.status   = status;
    if (username) allowed.username = username;
    if (email)    allowed.email    = email;

    const user = await User.findByIdAndUpdate(req.params.id, allowed, {
      new: true, runValidators: true,
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user.toPublic() });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN: DELETE /api/users/:id ────────────────────────────────────────────

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN: GET /api/users/stats ─────────────────────────────────────────────

exports.getUserStats = async (req, res, next) => {
  try {
    const [total, active, suspended, byRole] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    ]);

    res.status(200).json({ success: true, data: { total, active, suspended, byRole } });
  } catch (err) {
    next(err);
  }
};

// ─── USER: GET /api/users/me/watchlist ───────────────────────────────────────

exports.getWatchlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('watchlist.mediaId');
    res.status(200).json({ success: true, data: user.watchlist });
  } catch (err) {
    next(err);
  }
};

// ─── USER: POST /api/users/me/watchlist ──────────────────────────────────────

exports.addToWatchlist = async (req, res, next) => {
  try {
    const { mediaId, mediaType } = req.body;
    if (!mediaId || !mediaType) {
      return res.status(400).json({ success: false, message: 'mediaId and mediaType are required' });
    }

    const mediaExists = await Media.findById(mediaId);
    if (!mediaExists) return res.status(404).json({ success: false, message: 'Media not found' });

    const user = await User.findById(req.user._id);
    const alreadyAdded = user.watchlist.some(w => w.mediaId.toString() === mediaId);
    if (alreadyAdded) {
      return res.status(409).json({ success: false, message: 'Already in watchlist' });
    }

    user.watchlist.push({ mediaId, mediaType });
    await user.save({ validateBeforeSave: false });

    res.status(201).json({ success: true, message: 'Added to watchlist', data: user.watchlist });
  } catch (err) {
    next(err);
  }
};

// ─── USER: DELETE /api/users/me/watchlist/:mediaId ───────────────────────────

exports.removeFromWatchlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.watchlist = user.watchlist.filter(
      w => w.mediaId.toString() !== req.params.mediaId
    );
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, message: 'Removed from watchlist', data: user.watchlist });
  } catch (err) {
    next(err);
  }
};
