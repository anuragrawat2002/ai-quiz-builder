import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { quizService } from '../../services/api';

export default function CreateQuiz() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    duration: 30,
    category: '',
    tags: '',
    settings: {
      shuffleQuestions: false,
      shuffleOptions: false,
      negativeMarking: false,
      showResults: true,
      maxAttempts: 1,
      passingScore: 60,
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Quiz title is required');
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      const { data } = await quizService.create(payload);
      toast.success('Quiz created! Now add your questions.');
      navigate(`/teacher/quiz/${data.quiz._id}/edit`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setSetting = (key, val) => setForm(f => ({ ...f, settings: { ...f.settings, [key]: val } }));

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/teacher" className="p-2 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Create New Quiz</h1>
          <p className="text-gray-500 text-sm">Fill in the details, then add questions</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-400" /> Basic Information</h2>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Quiz Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Java OOP Fundamentals"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Brief description of the quiz..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={e => set('category', e.target.value)}
                placeholder="e.g. Java, Networking"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Duration (minutes)</label>
              <input
                type="number"
                min="1"
                max="300"
                value={form.duration}
                onChange={e => set('duration', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Tags (comma separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
              placeholder="java, oop, beginner"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600"
            />
          </div>
        </div>

        {/* Settings */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-white">Quiz Settings</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Passing Score (%)</label>
              <input
                type="number" min="0" max="100"
                value={form.settings.passingScore}
                onChange={e => setSetting('passingScore', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Max Attempts</label>
              <select
                value={form.settings.maxAttempts}
                onChange={e => setSetting('maxAttempts', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value={1}>1 (Once)</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={99}>Unlimited</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { key: 'shuffleQuestions', label: 'Shuffle Questions', desc: 'Randomize question order for each student' },
              { key: 'shuffleOptions', label: 'Shuffle Options', desc: 'Randomize answer choices order' },
              { key: 'negativeMarking', label: 'Negative Marking', desc: 'Deduct 0.25 marks for wrong answers' },
              { key: 'showResults', label: 'Show Results After Submission', desc: 'Students can see correct answers' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-gray-800 hover:bg-gray-750 transition-colors">
                <input
                  type="checkbox"
                  checked={form.settings[key]}
                  onChange={e => setSetting(key, e.target.checked)}
                  className="accent-indigo-500 w-4 h-4"
                />
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full gradient-primary text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? 'Creating...' : 'Create Quiz & Add Questions'}
        </button>
      </form>
    </div>
  );
}
