import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Trophy, Target, BookOpen, TrendingUp, Clock, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { quizService, attemptService, analyticsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      <Icon className="w-4 h-4" />
    </div>
    <p className="text-xl font-bold text-white">{value}</p>
    <p className="text-gray-500 text-xs mt-0.5">{label}</p>
  </div>
);

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [qRes, aRes, anRes] = await Promise.all([
          quizService.getAll({ limit: 10 }),
          attemptService.getMyAttempts(),
          analyticsService.getStudent(),
        ]);
        setQuizzes(qRes.data.quizzes || []);
        setAttempts(aRes.data.attempts || []);
        setAnalytics(anRes.data);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const attemptedIds = new Set(attempts.map(a => a.quizId?._id));
  const availableQuizzes = quizzes.filter(q => !attemptedIds.has(q._id));

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-800 rounded-2xl skeleton" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="h-64 bg-gray-800 rounded-2xl skeleton" />
          <div className="h-64 bg-gray-800 rounded-2xl skeleton" />
        </div>
      </div>
    );
  }

  const summary = analytics?.summary || {};

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Hi, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-400 text-sm mt-1">Ready to test your knowledge?</p>
        </div>
        <Link
          to="/student/join"
          className="flex items-center gap-2 gradient-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
        >
          <Zap className="w-4 h-4" /> Join Quiz
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Quizzes Taken" value={summary.totalAttempts || 0} color="bg-indigo-500/10 text-indigo-400" />
        <StatCard icon={Target} label="Avg Score" value={`${summary.averageScore || 0}%`} color="bg-violet-500/10 text-violet-400" />
        <StatCard icon={Trophy} label="Best Score" value={`${summary.bestScore || 0}%`} color="bg-amber-500/10 text-amber-400" />
        <StatCard icon={TrendingUp} label="Pass Rate" value={`${summary.passRate || 0}%`} color="bg-green-500/10 text-green-400" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Available Quizzes */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">Available Quizzes</h2>
            <span className="text-xs text-gray-500">{availableQuizzes.length} new</span>
          </div>
          {availableQuizzes.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen className="w-10 h-10 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No new quizzes available</p>
              <Link to="/student/join" className="text-indigo-400 text-xs mt-1 inline-block hover:text-indigo-300">
                Join with a code →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {availableQuizzes.slice(0, 5).map(quiz => (
                <div key={quiz._id} className="p-4 flex items-center gap-3 hover:bg-gray-800/50 transition-colors">
                  <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{quiz.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <Clock className="w-3 h-3" />{quiz.duration}min
                      <span>•</span>{quiz.questions?.length || 0} Qs
                      {quiz.category && <><span>•</span>{quiz.category}</>}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/quiz/${quiz._id}/attempt`)}
                    className="shrink-0 text-xs gradient-primary text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Start
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Attempts */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">Recent Attempts</h2>
            <Link to="/teacher/analytics" className="text-xs text-indigo-400 hover:text-indigo-300">View all</Link>
          </div>
          {attempts.length === 0 ? (
            <div className="text-center py-10">
              <BarChart3 className="w-10 h-10 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No attempts yet</p>
              <p className="text-gray-600 text-xs">Complete a quiz to see your results here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {attempts.slice(0, 5).map(a => (
                <Link
                  key={a._id}
                  to={`/attempt/${a._id}/result`}
                  className="p-4 flex items-center gap-3 hover:bg-gray-800/50 transition-colors block"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                    ${a.passed ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {a.passed
                      ? <CheckCircle className="w-4 h-4 text-green-400" />
                      : <XCircle className="w-4 h-4 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{a.quizId?.title || 'Quiz'}</p>
                    <p className="text-gray-500 text-xs">{new Date(a.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-sm ${a.passed ? 'text-green-400' : 'text-red-400'}`}>{a.percentage}%</p>
                    <p className="text-gray-600 text-xs">{a.score}/{a.totalMarks}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
