const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../config/jwt');

// ─── helpers ────────────────────────────────────────────────────────────────

const sendTokens = async (user, statusCode, res) => {
  const payload = { id: user._id, role: user.role };

  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // persist refresh token hash in DB (simple string store — hash for extra security in prod)
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // send refresh token in httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(statusCode).json({
    success: true,
    accessToken,
    user: user.toPublic(),
  });
};

// ─── @POST /api/auth/signup ──────────────────────────────────────────────────

exports.signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email and password are required' });
    }

    const user = await User.create({ username, email, password });
    await sendTokens(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// ─── @POST /api/auth/login ───────────────────────────────────────────────────

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    // explicitly select password field (it is select:false in schema)
    const user = await User.findOne({ username }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account is suspended or inactive' });
    }

    await sendTokens(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ─── @POST /api/auth/refresh ─────────────────────────────────────────────────

exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token missing' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Refresh token reuse detected — please log in again' });
    }

    await sendTokens(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ─── @POST /api/auth/logout ──────────────────────────────────────────────────

exports.logout = async (req, res, next) => {
  try {
    // clear refresh token in DB
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── @GET /api/auth/me ───────────────────────────────────────────────────────

exports.getMe = (req, res) => {
  res.status(200).json({ success: true, user: req.user.toPublic() });
};

// ─── @PUT /api/auth/change-password ─────────────────────────────────────────

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both currentPassword and newPassword are required' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};
