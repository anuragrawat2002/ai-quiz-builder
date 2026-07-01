const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post('/start', authorize('student'), attemptController.startAttempt);
router.post('/:id/submit', authorize('student'), attemptController.submitAttempt);
router.get('/my', authorize('student'), attemptController.getMyAttempts);
router.get('/quiz/:quizId/leaderboard', attemptController.getLeaderboard);
router.get('/:id', attemptController.getAttempt);

module.exports = router;
