const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Media name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['movie', 'show'],
      required: true,
    },
    genre: {
      type: String,
      trim: true,
    },
    platform: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    img: {
      type: String,
      default: '',
    },
    video: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    releaseYear: {
      type: Number,
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

// text index for search
mediaSchema.index({ name: 'text', genre: 'text' });

module.exports = mongoose.model('Media', mediaSchema);
