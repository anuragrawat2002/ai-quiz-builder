const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const User = require('../models/User');

/**
 * @route   POST /api/quiz
 * @desc    Create a new quiz
 * @access  Teacher only
 */
exports.createQuiz = async (req, res, next) => {
  try {
    const { title, description, duration, settings, category, tags, questions } = req.body;

    const quiz = await Quiz.create({
      title,
      description,
      duration: duration || 30,
      settings,
      category,
      tags,
      questions: questions || [],
      createdBy: req.user._id,
    });

    // Update teacher stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalQuizzesCreated: 1 } });

    await quiz.populate('createdBy', 'name email');
    res.status(201).json({ message: 'Quiz created successfully!', quiz });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/quiz
 * @desc    Get all quizzes (teacher: own quizzes, student: published quizzes)
 * @access  Private
 */
exports.getQuizzes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search, category } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};

    if (req.user.role === 'teacher') {
      filter.createdBy = req.user._id;
      if (status) filter.status = status;
    } else {
      filter.status = 'published';
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) filter.category = { $regex: category, $options: 'i' };

    const [quizzes, total] = await Promise.all([
      Quiz.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Quiz.countDocuments(filter),
    ]);

    res.json({
      quizzes,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/quiz/:id
 * @desc    Get single quiz by ID
 * @access  Private
 */
exports.getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('createdBy', 'name email');

    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

    // Students can only see published quizzes
    if (req.user.role === 'student' && quiz.status !== 'published') {
      return res.status(403).json({ error: 'This quiz is not available.' });
    }

    // Teachers can only see their own quizzes
    if (req.user.role === 'teacher' && quiz.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // For students attempting quiz, shuffle if configured
    let quizData = quiz.toObject();
    if (req.user.role === 'student' && quiz.settings.shuffleQuestions) {
      quizData.questions = [...quizData.questions].sort(() => Math.random() - 0.5);
    }
    if (req.user.role === 'student' && quiz.settings.shuffleOptions) {
      quizData.questions = quizData.questions.map((q) => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5),
      }));
    }

    // Hide correct answers from students during attempt
    if (req.user.role === 'student') {
      quizData.questions = quizData.questions.map((q) => {
        const { correctAnswer, explanation, ...rest } = q;
        return rest;
      });
    }

    res.json({ quiz: quizData });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/quiz/code/:code
 * @desc    Get quiz by quiz code (student join)
 * @access  Private
 */
exports.getQuizByCode = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      quizCode: req.params.code.toUpperCase(),
      status: 'published',
    }).populate('createdBy', 'name email');

    if (!quiz) return res.status(404).json({ error: 'Invalid quiz code or quiz not available.' });

    // Check if student already attempted (if max attempts is 1)
    if (quiz.settings.maxAttempts === 1) {
      const existing = await Attempt.findOne({
        studentId: req.user._id,
        quizId: quiz._id,
        status: { $in: ['submitted', 'timed-out'] },
      });
      if (existing) {
        return res.status(409).json({ error: 'You have already attempted this quiz.', attemptId: existing._id });
      }
    }

    res.json({ quiz });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/quiz/:id
 * @desc    Update quiz
 * @access  Teacher only (own quiz)
 */
exports.updateQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

    if (quiz.status === 'closed') {
      return res.status(400).json({ error: 'Cannot edit a closed quiz.' });
    }

    const updates = req.body;
    delete updates.createdBy;
    delete updates.quizCode;

    Object.assign(quiz, updates);
    await quiz.save();

    res.json({ message: 'Quiz updated successfully!', quiz });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/quiz/:id/publish
 * @desc    Publish a quiz
 * @access  Teacher only
 */
exports.publishQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

    if (quiz.questions.length === 0) {
      return res.status(400).json({ error: 'Cannot publish a quiz without questions.' });
    }

    quiz.status = 'published';
    quiz.publishedAt = new Date();
    await quiz.save();

    res.json({ message: 'Quiz published successfully!', quiz });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/quiz/:id
 * @desc    Delete quiz
 * @access  Teacher only
 */
exports.deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

    // Remove all attempts for this quiz
    await Attempt.deleteMany({ quizId: req.params.id });
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalQuizzesCreated: -1 } });

    res.json({ message: 'Quiz deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/quiz/:id/questions
 * @desc    Add question to quiz
 * @access  Teacher only
 */
exports.addQuestion = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

    quiz.questions.push({ ...req.body, order: quiz.questions.length });
    await quiz.save();

    res.status(201).json({ message: 'Question added!', quiz });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/quiz/:id/questions/:qid
 * @desc    Update a question
 * @access  Teacher only
 */
exports.updateQuestion = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

    const question = quiz.questions.id(req.params.qid);
    if (!question) return res.status(404).json({ error: 'Question not found.' });

    Object.assign(question, req.body);
    await quiz.save();

    res.json({ message: 'Question updated!', quiz });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/quiz/:id/questions/:qid
 * @desc    Delete a question
 * @access  Teacher only
 */
exports.deleteQuestion = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

    quiz.questions = quiz.questions.filter((q) => q._id.toString() !== req.params.qid);
    await quiz.save();

    res.json({ message: 'Question deleted!', quiz });
  } catch (error) {
    next(error);
  }
};
