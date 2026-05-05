const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    profilePic: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&q=80',
      trim: true,
    },
    bio: {
      type: String,
      default: 'Tell your story in a few words.',
      maxlength: 280,
      trim: true,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    notifications: [
      {
        type: {
          type: String,
          enum: ['like', 'comment', 'follow'],
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        postId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Post',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.index({ name: 'text', email: 'text' });

module.exports = mongoose.model('User', userSchema);
