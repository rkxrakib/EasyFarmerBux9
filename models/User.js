const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: false
  },
  completed: {
    type: Boolean,
    default: false
  },
  claimed: {
    type: Boolean,
    default: false
  },
  referredAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: false
  },
  firstName: {
    type: String,
    required: false
  },
  telegramUsername: {
    type: String,
    required: false
  },
  twitterUsername: {
    type: String,
    required: false
  },
  usdtBEP20Address: {
    type: String,
    required: false
  },
  balance: {
    type: Number,
    default: 0
  },
  referrals: [referralSchema],
  profileCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;