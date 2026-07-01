import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles, Sliders, BookOpen, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { aiService } from '../../services/api';

const PROMPT_SUGGESTIONS = [
  'Generate 10 Java OOP MCQs with polymorphism and inheritance',
  'Create 15 DBMS questions on normalization and SQL joins',
  'Generate a Data Structures quiz on trees and graphs',
  '10 questions on React hooks and component lifecycle',
  'Computer Networks OSI model and TCP/IP protocols',
  'Python basics for beginners - 12 MCQ questions',
];

export default function AIQuizGenerator() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    prompt: '',
    count: 10,
    difficulty: 'medium',
    title: '',
    description: '',
    duration: 30,
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: configure, 2: generating

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.prompt.trim()) return toast.error('Please enter a topic or prompt');

    setLoading(true);
    setStep(2);
    try {
      const { data } = await aiService.generateQuiz(form);
      toast.success(`Generated ${data.quiz.questions.length} questions!`);
      navigate(`/teacher/quiz/${data.quiz._id}/edit`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI generation failed. Check your API key.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  if (step === 2 && loading) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full gradient-primary opacity-20 animate-ping" />
          <div className="relative w-24 h-24 rounded-full gradient-primary flex items-center justify-center">
            <Brain className="w-10 h-10 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Generating your quiz...</h2>
        <p className="text-gray-400 mb-2">Gemini AI is crafting {form.count} {form.difficulty} questions</p>
        <p className="text-gray-600 text-sm">Topic: "{form.prompt}"</p>
        <div className="mt-8 flex justify-center gap-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">AI Quiz Generator</h1>
          <p className="text-gray-400 text-sm">Powered by Google Gemini</p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-5">
        {/* Prompt */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Your Prompt *
          </label>
          <textarea
            value={form.prompt}
            onChange={(e) => setForm({ ...form, prompt: e.target.value })}
            placeholder="e.g. Generate 10 Java OOP MCQs covering inheritance and polymorphism"
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl p-3.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-gray-600 resize-none"
          />
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {PROMPT_SUGGESTIONS.slice(0, 4).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setForm({ ...form, prompt: s })}
                  className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  {s.length > 50 ? s.slice(0, 50) + '...' : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" /> Quiz Settings
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Quiz Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Leave blank for auto-title"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Java, DBMS, Networking"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Number of Questions: <span className="text-indigo-400 font-bold">{form.count}</span>
              </label>
              <input
                type="range"
                min="5"
                max="20"
                value={form.count}
                onChange={(e) => setForm({ ...form, count: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>5</span><span>20</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Duration: <span className="text-indigo-400 font-bold">{form.duration} min</span>
              </label>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>5min</span><span>120min</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-2">Difficulty Level</label>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'medium', 'hard'].map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setForm({ ...form, difficulty: d })}
                    className={`py-2.5 rounded-xl text-sm font-medium capitalize transition-all
                      ${form.difficulty === d
                        ? d === 'easy' ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                          : d === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                          : 'bg-red-500/20 text-red-400 border border-red-500/50'
                        : 'bg-gray-800 border border-gray-700 text-gray-500 hover:border-gray-600'
                      }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-3 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-400">
            Generated quiz will be saved as a <strong className="text-white">draft</strong>. You can review, edit, and then publish it for students.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !form.prompt.trim()}
          className="w-full gradient-primary text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-indigo-500/20"
        >
          <Brain className="w-5 h-5" />
          Generate Quiz with AI
          <ChevronRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
