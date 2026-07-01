import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Search, Clock, HelpCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { quizService } from '../../services/api';

export default function JoinQuiz() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!code.trim()) return toast.error('Enter a quiz code');
    setLoading(true);
    try {
      const { data } = await quizService.getByCode(code.trim().toUpperCase());
      setPreview(data.quiz);
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('You already attempted this quiz');
        if (err.response.data.attemptId) navigate(`/attempt/${err.response.data.attemptId}/result`);
      } else {
        toast.error(err.response?.data?.error || 'Quiz not found');
      }
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (preview) navigate(`/quiz/${preview._id}/attempt`);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 mt-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/30">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Join a Quiz</h1>
        <p className="text-gray-400 text-sm mt-1">Enter the quiz code provided by your teacher</p>
      </div>

      <form onSubmit={handleLookup} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="Enter quiz code (e.g. AB12CD34)"
          maxLength={8}
          className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm tracking-widest font-mono font-bold uppercase focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600"
        />
        <button
          type="submit"
          disabled={loading}
          className="gradient-primary text-white px-5 py-3 rounded-xl font-medium hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center gap-2"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </form>

      {preview && (
        <div className="bg-gray-900 border border-indigo-500/50 rounded-2xl p-5 animate-fade-in-up">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{preview.title}</h3>
              <p className="text-gray-500 text-sm">{preview.description}</p>
              <p className="text-xs text-gray-600 mt-1">by {preview.createdBy?.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Questions', value: preview.questions?.length || 0 },
              { label: 'Duration', value: `${preview.duration} min` },
              { label: 'Total Marks', value: preview.totalMarks || 0 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl mb-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-medium mb-1">
              <Clock className="w-3.5 h-3.5" /> Instructions
            </div>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Timer starts as soon as you begin</li>
              <li>• Quiz will auto-submit when time runs out</li>
              {preview.settings?.shuffleQuestions && <li>• Questions are shuffled</li>}
              {preview.settings?.negativeMarking && <li>• Negative marking is enabled (−0.25 per wrong)</li>}
              <li>• You have {preview.settings?.maxAttempts || 1} attempt(s)</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="w-full gradient-primary text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            Start Quiz <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
