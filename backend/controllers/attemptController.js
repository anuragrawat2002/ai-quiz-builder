const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');
const User = require('../models/User');

/**
 * @route   POST /api/attempts/start
 * @desc    Start a quiz attempt
 * @access  Student only
 */
exports.startAttempt = async (req, res, next) => {
  try {
    const { quizId } = req.body;

    const quiz = await Quiz.findOne({ _id: quizId, status: 'published' });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found or not available.' });

    // Check for existing in-progress attempt
    const inProgress = await Attempt.findOne({
      studentId: req.user._id,
      quizId,
      status: 'in-progress',
    });
    if (inProgress) return res.json({ message: 'Resuming attempt', attempt: inProgress });

    // Check max attempts
    if (quiz.settings.maxAttempts === 1) {
      const completed = await Attempt.findOne({
        studentId: req.user._id,
        quizId,
        status: { $in: ['submitted', 'timed-out'] },
      });
      if (completed) {
        return res.status(409).json({ error: 'You have already attempted this quiz.' });
      }
    }

    const attempt = await Attempt.create({
      studentId: req.user._id,
      quizId,
      totalMarks: quiz.totalMarks,
      startedAt: new Date(),
    });

    // Emit to quiz room: student joined
    if (req.io) {
      req.io.to(`quiz-${quizId}`).emit('participant-joined', {
        studentId: req.user._id,
        name: req.user.name,
        quizId,
      });
    }

    res.status(201).json({ message: 'Quiz started!', attempt });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/attempts/:id/submit
 * @desc    Submit quiz attempt
 * @access  Student only
 */
exports.submitAttempt = async (req, res, next) => {
  try {
    const { answers, timeTaken } = req.body;
    const attempt = await Attempt.findOne({
      _id: req.params.id,
      studentId: req.user._id,
    });

    if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });
    if (attempt.status !== 'in-progress') {
      return res.status(400).json({ error: 'Attempt already submitted.' });
    }

    const quiz = await Quiz.findById(attempt.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

    // Grade the answers
    let score = 0;
    const gradedAnswers = quiz.questions.map((question) => {
      const answer = answers.find((a) => a.questionId === question._id.toString());
      const selectedAnswer = answer ? answer.selectedAnswer : null;
      const isCorrect = selectedAnswer === question.correctAnswer;

      let marksAwarded = 0;
      if (isCorrect) {
        marksAwarded = question.marks || 1;
        score += marksAwarded;
      } else if (quiz.settings.negativeMarking && selectedAnswer) {
        marksAwarded = -(quiz.settings.negativeMarkValue || 0.25);
        score += marksAwarded;
      }

      return {
        questionId: question._id,
        selectedAnswer,
        isCorrect,
        marksAwarded,
        timeTaken: answer ? answer.timeTaken : 0,
      };
    });

    score = Math.max(0, score); // No negative total
    const percentage = quiz.totalMarks > 0 ? (score / quiz.totalMarks) * 100 : 0;
    const passed = percentage >= (quiz.settings.passingScore || 60);

    attempt.answers = gradedAnswers;
    attempt.score = score;
    attempt.percentage = parseFloat(percentage.toFixed(2));
    attempt.timeTaken = timeTaken || 0;
    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    attempt.passed = passed;
    await attempt.save();

    // Update quiz stats
    const allAttempts = await Attempt.find({
      quizId: quiz._id,
      status: { $in: ['submitted', 'timed-out'] },
    });

    const avgScore =
      allAttempts.reduce((sum, a) => sum + a.score, 0) / allAttempts.length;

    await Quiz.findByIdAndUpdate(quiz._id, {
      totalAttempts: allAttempts.length,
      averageScore: parseFloat(avgScore.toFixed(2)),
    });

    // Update student stats
    const studentAttempts = await Attempt.find({
      studentId: req.user._id,
      status: { $in: ['submitted', 'timed-out'] },
    });
    const studentAvg =
      studentAttempts.reduce((sum, a) => sum + a.score, 0) / studentAttempts.length;
    await User.findByIdAndUpdate(req.user._id, {
      totalQuizzesTaken: studentAttempts.length,
      averageScore: parseFloat(studentAvg.toFixed(2)),
    });

    // Get leaderboard & calculate rank
    const leaderboard = await getLeaderboardData(quiz._id);
    const userRank = leaderboard.findIndex((e) => e.studentId.toString() === req.user._id.toString()) + 1;

    attempt.rank = userRank;
    await attempt.save();

    // Emit real-time leaderboard update
    if (req.io) {
      req.io.to(`quiz-${quiz._id}`).emit('leaderboard-update', {
        leaderboard,
        newSubmission: {
          studentId: req.user._id,
          name: req.user.name,
          score,
          percentage,
          rank: userRank,
        },
      });
    }

    res.json({
      message: 'Quiz submitted successfully!',
      attempt,
      rank: userRank,
      leaderboard: leaderboard.slice(0, 10),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/attempts/quiz/:quizId/leaderboard
 * @desc    Get leaderboard for a quiz
 * @access  Private
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const leaderboard = await getLeaderboardData(quizId);
    const quiz = await Quiz.findById(quizId).select('title totalMarks totalAttempts');

    res.json({ leaderboard, quiz });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/attempts/my
 * @desc    Get current student's attempts
 * @access  Student only
 */
exports.getMyAttempts = async (req, res, next) => {
  try {
    const attempts = await Attempt.find({
      studentId: req.user._id,
      status: { $in: ['submitted', 'timed-out'] },
    })
      .populate('quizId', 'title quizCode totalMarks duration category')
      .sort({ submittedAt: -1 })
      .lean();

    res.json({ attempts });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/attempts/:id
 * @desc    Get attempt details
 * @access  Private
 */
exports.getAttempt = async (req, res, next) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('quizId');

    if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });

    // Students can only view their own attempts
    if (req.user.role === 'student' && attempt.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ attempt });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Fetch and sort leaderboard for a quiz
 */
const getLeaderboardData = async (quizId) => {
  const attempts = await Attempt.find({
    quizId,
    status: { $in: ['submitted', 'timed-out'] },
  })
    .populate('studentId', 'name email avatar')
    .sort({ score: -1, submittedAt: 1 })
    .lean();

  return attempts.map((attempt, index) => ({
    rank: index + 1,
    studentId: attempt.studentId._id,
    name: attempt.studentId.name,
    email: attempt.studentId.email,
    avatar: attempt.studentId.avatar,
    score: attempt.score,
    totalMarks: attempt.totalMarks,
    percentage: attempt.percentage,
    submittedAt: attempt.submittedAt,
    timeTaken: attempt.timeTaken,
    passed: attempt.passed,
  }));
};
