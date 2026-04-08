const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned by default
    },
    role: {
      type: String,
      enum: ['user', 'premium', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'inactive'],
      default: 'active',
    },
    watchlist: [
      {
        mediaId:   { type: mongoose.Schema.Types.ObjectId },
        mediaType: { type: String, enum: ['movie', 'show'] },
        addedAt:   { type: Date, default: Date.now },
      },
    ],
    refreshToken: { type: String, select: false },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method: compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method: safe public profile (no sensitive fields)
userSchema.methods.toPublic = function () {
  return {
    _id:       this._id,
    username:  this.username,
    email:     this.email,
    role:      this.role,
    status:    this.status,
    watchlist: this.watchlist,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
