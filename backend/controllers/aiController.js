const { GoogleGenerativeAI } = require('@google/generative-ai');
const Quiz = require('../models/Quiz');
const User = require('../models/User');

/**
 * @route   POST /api/ai/generate-quiz
 * @desc    Generate quiz questions using Gemini AI
 * @access  Teacher only
 */
exports.generateQuiz = async (req, res, next) => {
  try {
    const { prompt, count = 10, difficulty = 'medium', title, description, duration, category } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured. Please add GEMINI_API_KEY.' });
    }

    if (!prompt || prompt.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide a valid prompt.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `You are an expert quiz generator. Generate exactly ${Math.min(count, 20)} multiple choice questions based on the given topic.

IMPORTANT: Respond ONLY with valid JSON, no markdown, no code blocks, no extra text.

JSON format:
{
  "questions": [
    {
      "questionText": "Question here?",
      "options": [
        {"label": "A", "text": "Option A text"},
        {"label": "B", "text": "Option B text"},
        {"label": "C", "text": "Option C text"},
        {"label": "D", "text": "Option D text"}
      ],
      "correctAnswer": "A",
      "difficulty": "${difficulty}",
      "explanation": "Brief explanation of correct answer",
      "marks": 1
    }
  ]
}

Rules:
- Generate exactly ${Math.min(count, 20)} questions
- correctAnswer must be exactly "A", "B", "C", or "D"
- difficulty must be "easy", "medium", or "hard"
- Make questions clear, unambiguous, and educational
- Topic: ${prompt}`;

    const result = await model.generateContent(systemPrompt);
    const rawText = result.response.text().trim();

    // Parse JSON - strip any accidental markdown
    let parsed;
    try {
      const clean = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (parseError) {
      console.error('Gemini parse error:', rawText.slice(0, 200));
      return res.status(500).json({ error: 'AI returned invalid format. Please try again.' });
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return res.status(500).json({ error: 'AI returned unexpected data. Please try again.' });
    }

    // Validate and sanitize questions
    const validatedQuestions = parsed.questions
      .filter((q) => q.questionText && q.options && q.correctAnswer)
      .map((q, i) => ({
        questionText: q.questionText,
        options: q.options.slice(0, 4).map((o) => ({ label: o.label, text: o.text })),
        correctAnswer: q.correctAnswer.toUpperCase(),
        difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : difficulty,
        explanation: q.explanation || '',
        marks: q.marks || 1,
        order: i,
      }));

    if (validatedQuestions.length === 0) {
      return res.status(500).json({ error: 'No valid questions generated. Please refine your prompt.' });
    }

    // Create the quiz in DB
    const quiz = await Quiz.create({
      title: title || `AI Quiz: ${prompt.slice(0, 50)}`,
      description: description || `AI-generated quiz on: ${prompt}`,
      duration: duration || 30,
      category: category || 'AI Generated',
      questions: validatedQuestions,
      createdBy: req.user._id,
      isAIGenerated: true,
      aiPrompt: prompt,
      status: 'draft',
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { totalQuizzesCreated: 1 } });
    await quiz.populate('createdBy', 'name email');

    res.status(201).json({
      message: `Successfully generated ${validatedQuestions.length} questions!`,
      quiz,
    });
  } catch (error) {
    if (error.message?.includes('API key')) {
      return res.status(401).json({ error: 'Invalid Gemini API key.' });
    }
    if (error.message?.includes('quota')) {
      return res.status(429).json({ error: 'AI quota exceeded. Please try again later.' });
    }
    next(error);
  }
};

/**
 * @route   POST /api/ai/explain
 * @desc    Get AI explanation for a question/answer
 * @access  Private
 */
exports.explainAnswer = async (req, res, next) => {
  try {
    const { questionText, correctAnswer, options } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Explain why "${correctAnswer}" is the correct answer for this question:
Question: ${questionText}
Options: ${options.map((o) => `${o.label}: ${o.text}`).join(', ')}

Give a clear, concise educational explanation in 2-3 sentences.`;

    const result = await model.generateContent(prompt);
    const explanation = result.response.text().trim();

    res.json({ explanation });
  } catch (error) {
    next(error);
  }
};
