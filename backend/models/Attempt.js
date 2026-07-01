const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  selectedAnswer: { type: String, default: null },
  isCorrect: { type: Boolean, default: false },
  marksAwarded: { type: Number, default: 0 },
  timeTaken: { type: Number, default: 0 }, // seconds
});

const attemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    answers: [answerSchema],
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 }, // total seconds
    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'timed-out'],
      default: 'in-progress',
    },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    passed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for leaderboard queries
attemptSchema.index({ quizId: 1, score: -1, submittedAt: 1 });
attemptSchema.index({ studentId: 1 });

module.exports = mongoose.model('Attempt', attemptSchema);
