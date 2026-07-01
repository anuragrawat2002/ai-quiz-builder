
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, CheckCircle, XCircle, Clock, BarChart3, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { attemptService } from '../../services/api';

export default function AttemptResult() {
  const { id } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await attemptService.getById(id);
        setAttempt(data.attempt);
      } catch {
        toast.error('Failed to load result');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Result not found</p>
          <Link to="/student" className="text-indigo-400 hover:text-indigo-300">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const quiz = attempt.quizId;
  const pct = attempt.percentage;
  const passed = attempt.passed;
  const correct = attempt.answers?.filter(a => a.isCorrect).length || 0;

  const circumference = 2 * Math.PI * 54;
  const strokeDash = (pct / 100) * circumference;

  return (
    <div className="min-h-screen bg-gray-950 text-white py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Score card */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 text-center">
          <div className="relative w-36 h-36 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#1f2937" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke={passed ? '#6366f1' : '#ef4444'}
                strokeWidth="10"
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white">{pct}%</span>
              <span className={`text-xs font-semibold ${passed ? 'text-green-400' : 'text-red-400'}`}>
                {passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-1">{quiz?.title}</h2>
          <p className="text-gray-500 text-sm mb-6">
            {passed ? '🎉 Great work! You passed this quiz.' : 'Keep practicing — you can do better!'}
          </p>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Score', value: `${attempt.score}/${attempt.totalMarks}` },
              { label: 'Correct', value: correct, color: 'text-green-400' },
              { label: 'Wrong', value: (quiz?.questions?.length || 0) - correct, color: 'text-red-400' },
              { label: 'Rank', value: attempt.rank ? `#${attempt.rank}` : '—' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-800 rounded-xl p-3">
                <p className={`text-lg font-bold ${color || 'text-white'}`}>{value}</p>
                <p className="text-gray-500 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            to={`/quiz/${quiz?._id}/leaderboard`}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Trophy className="w-4 h-4" /> View Leaderboard
          </Link>
          <Link
            to="/student"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Answer review */}
        {quiz?.questions && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl">
            <div className="p-5 border-b border-gray-800">
              <h3 className="font-semibold text-white">Answer Review</h3>
            </div>
            <div className="divide-y divide-gray-800">
              {quiz.questions.map((q, i) => {
                const ans = attempt.answers?.find(a => a.questionId === q._id);
                const isCorrect = ans?.isCorrect;
                const expanded = expandedQ === q._id;

                return (
                  <div key={q._id}>
                    <button
                      onClick={() => setExpandedQ(expanded ? null : q._id)}
                      className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-800/50 transition-colors"
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {isCorrect
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                          : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium line-clamp-2">{q.questionText}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>Your answer: <span className={isCorrect ? 'text-green-400' : 'text-red-400'}>{ans?.selectedAnswer || 'Not answered'}</span></span>
                          {!isCorrect && <span>• Correct: <span className="text-green-400">{q.correctAnswer}</span></span>}
                        </div>
                      </div>
                      {expanded ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
                    </button>

                    {expanded && (
                      <div className="px-4 pb-4 ml-9 space-y-2">
                        {q.options?.map(opt => (
                          <div key={opt.label} className={`flex items-center gap-2 p-2.5 rounded-xl text-sm border
                            ${opt.label === q.correctAnswer ? 'bg-green-500/10 border-green-500/30 text-green-300' :
                              opt.label === ans?.selectedAnswer && !isCorrect ? 'bg-red-500/10 border-red-500/30 text-red-300' :
                              'bg-gray-800 border-gray-700 text-gray-400'}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                              ${opt.label === q.correctAnswer ? 'bg-green-500 text-white' :
                                opt.label === ans?.selectedAnswer && !isCorrect ? 'bg-red-500 text-white' :
                                'bg-gray-700 text-gray-400'}`}>
                              {opt.label}
                            </span>
                            {opt.text}
                          </div>
                        ))}
                        {q.explanation && (
                          <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-xs text-gray-400">
                            <span className="text-indigo-400 font-medium">Explanation: </span>{q.explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
