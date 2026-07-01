const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  options: [
    {
      label: { type: String, required: true }, // A, B, C, D
      text: { type: String, required: true },
    },
  ],
  correctAnswer: {
    type: String,
    required: [true, 'Correct answer is required'],
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  explanation: { type: String, default: '' },
  marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
});

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    quizCode: {
      type: String,
      unique: true,
      default: () => uuidv4().slice(0, 8).toUpperCase(),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    questions: [questionSchema],
    duration: {
      type: Number, // in minutes
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
      default: 30,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'draft',
    },
    settings: {
      shuffleQuestions: { type: Boolean, default: false },
      shuffleOptions: { type: Boolean, default: false },
      showResults: { type: Boolean, default: true },
      negativeMarking: { type: Boolean, default: false },
      negativeMarkValue: { type: Number, default: 0.25 },
      maxAttempts: { type: Number, default: 1 },
      passingScore: { type: Number, default: 60 }, // percentage
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    tags: [{ type: String, trim: true }],
    isAIGenerated: { type: Boolean, default: false },
    aiPrompt: { type: String, default: '' },
    // Stats
    totalAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// Auto-calculate totalMarks before save
quizSchema.pre('save', function (next) {
  if (this.questions && this.questions.length > 0) {
    this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  }
  next();
});

// Index for quiz code lookup
quizSchema.index({ quizCode: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ status: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
