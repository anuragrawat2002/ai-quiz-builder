const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post('/generate-quiz', authorize('teacher'), aiController.generateQuiz);
router.post('/explain', aiController.explainAnswer);

module.exports = router;
