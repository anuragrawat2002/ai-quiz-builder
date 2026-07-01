const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/teacher', authorize('teacher'), analyticsController.getTeacherAnalytics);
router.get('/student', authorize('student'), analyticsController.getStudentAnalytics);

module.exports = router;
