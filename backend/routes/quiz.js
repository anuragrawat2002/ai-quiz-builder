const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', quizController.getQuizzes);
router.post('/', authorize('teacher'), quizController.createQuiz);
router.get('/code/:code', quizController.getQuizByCode);
router.get('/:id', quizController.getQuiz);
router.put('/:id', authorize('teacher'), quizController.updateQuiz);
router.put('/:id/publish', authorize('teacher'), quizController.publishQuiz);
router.delete('/:id', authorize('teacher'), quizController.deleteQuiz);
router.post('/:id/questions', authorize('teacher'), quizController.addQuestion);
router.put('/:id/questions/:qid', authorize('teacher'), quizController.updateQuestion);
router.delete('/:id/questions/:qid', authorize('teacher'), quizController.deleteQuestion);

module.exports = router;
