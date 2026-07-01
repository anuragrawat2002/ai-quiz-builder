const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const User = require('../models/User');

/**
 * @route   GET /api/analytics/teacher
 * @desc    Teacher dashboard analytics
 * @access  Teacher only
 */
exports.getTeacherAnalytics = async (req, res, next) => {
  try {
    const teacherId = req.user._id;

    const [quizzes, totalStudents, recentQuizzes] = await Promise.all([
      Quiz.find({ createdBy: teacherId }).lean(),
      User.countDocuments({ role: 'student' }),
      Quiz.find({ createdBy: teacherId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const quizIds = quizzes.map((q) => q._id);

    const attempts = await Attempt.find({
      quizId: { $in: quizIds },
      status: { $in: ['submitted', 'timed-out'] },
    })
      .populate('studentId', 'name email')
      .populate('quizId', 'title totalMarks')
      .lean();

    const totalAttempts = attempts.length;
    const averageScore =
      totalAttempts > 0
        ? attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts
        : 0;

    // Top performers
    const studentScores = {};
    attempts.forEach((a) => {
      const sid = a.studentId._id.toString();
      if (!studentScores[sid]) {
        studentScores[sid] = {
          name: a.studentId.name,
          email: a.studentId.email,
          totalScore: 0,
          attempts: 0,
        };
      }
      studentScores[sid].totalScore += a.score;
      studentScores[sid].attempts++;
    });

    const topPerformers = Object.values(studentScores)
      .map((s) => ({ ...s, averageScore: s.totalScore / s.attempts }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);

    // Quiz performance breakdown
    const quizPerformance = quizzes.map((quiz) => {
      const qAttempts = attempts.filter((a) => a.quizId._id.toString() === quiz._id.toString());
      const avg = qAttempts.length > 0
        ? qAttempts.reduce((sum, a) => sum + a.percentage, 0) / qAttempts.length
        : 0;
      return {
        quizId: quiz._id,
        title: quiz.title,
        totalAttempts: qAttempts.length,
        averageScore: parseFloat(avg.toFixed(1)),
        status: quiz.status,
      };
    });

    // Score distribution for charts
    const scoreDistribution = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 },
    ];
    attempts.forEach((a) => {
      const p = a.percentage;
      if (p <= 20) scoreDistribution[0].count++;
      else if (p <= 40) scoreDistribution[1].count++;
      else if (p <= 60) scoreDistribution[2].count++;
      else if (p <= 80) scoreDistribution[3].count++;
      else scoreDistribution[4].count++;
    });

    res.json({
      summary: {
        totalQuizzes: quizzes.length,
        publishedQuizzes: quizzes.filter((q) => q.status === 'published').length,
        totalStudents,
        totalAttempts,
        averageScore: parseFloat(averageScore.toFixed(1)),
      },
      recentQuizzes,
      topPerformers,
      quizPerformance,
      scoreDistribution,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analytics/student
 * @desc    Student dashboard analytics
 * @access  Student only
 */
exports.getStudentAnalytics = async (req, res, next) => {
  try {
    const attempts = await Attempt.find({
      studentId: req.user._id,
      status: { $in: ['submitted', 'timed-out'] },
    })
      .populate('quizId', 'title category totalMarks')
      .sort({ submittedAt: -1 })
      .lean();

    const totalAttempts = attempts.length;
    const averageScore =
      totalAttempts > 0
        ? attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts
        : 0;
    const bestScore = totalAttempts > 0 ? Math.max(...attempts.map((a) => a.percentage)) : 0;
    const passRate =
      totalAttempts > 0
        ? (attempts.filter((a) => a.passed).length / totalAttempts) * 100
        : 0;

    // Performance trend (last 10 attempts)
    const trend = attempts.slice(0, 10).reverse().map((a) => ({
      quiz: a.quizId?.title || 'Unknown',
      score: a.percentage,
      date: a.submittedAt,
    }));

    // Category breakdown
    const categoryMap = {};
    attempts.forEach((a) => {
      const cat = a.quizId?.category || 'General';
      if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 };
      categoryMap[cat].total += a.percentage;
      categoryMap[cat].count++;
    });
    const categoryBreakdown = Object.entries(categoryMap).map(([name, data]) => ({
      name,
      averageScore: parseFloat((data.total / data.count).toFixed(1)),
      attempts: data.count,
    }));

    res.json({
      summary: {
        totalAttempts,
        averageScore: parseFloat(averageScore.toFixed(1)),
        bestScore: parseFloat(bestScore.toFixed(1)),
        passRate: parseFloat(passRate.toFixed(1)),
      },
      recentAttempts: attempts.slice(0, 5),
      trend,
      categoryBreakdown,
    });
  } catch (error) {
    next(error);
  }
};
