const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');

router.get('/students', authenticate, async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').lean();
    res.json({ students });
  } catch (error) { next(error); }
});

module.exports = router;
