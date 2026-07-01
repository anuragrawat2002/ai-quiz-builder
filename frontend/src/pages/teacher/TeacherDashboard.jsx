import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle, Brain, BookOpen, Users, BarChart3,
  Share2, Edit, Trash2, Eye, Trophy, TrendingUp, Clock,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { quizService, analyticsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const StatusBadge = ({ status }) => {
  const styles = {
    published: 'bg-green-500/10 text-green-400 border-green-500/30',
    draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    closed: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-gray-700 transition-colors">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-gray-400 text-sm mt-0.5">{label}</p>
    {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
  </div>
);

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizRes, analyticsRes] = await Promise.all([
          quizService.getAll({ limit: 20 }),
          analyticsService.getTeacher(),
        ]);
        setQuizzes(quizRes.data.quizzes || []);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePublish = async (quizId) => {
    try {
      await quizService.publish(quizId);
      setQuizzes((prev) => prev.map((q) => q._id === quizId ? { ...q, status: 'published' } : q));
      toast.success('Quiz published!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to publish quiz');
    }
  };

  const handleDelete = async (quizId) => {
    if (!confirm('Delete this quiz? This cannot be undone.')) return;
    try {
      await quizService.delete(quizId);
      setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
      toast.success('Quiz deleted.');
    } catch (err) {
      toast.error('Failed to delete quiz');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Code "${code}" copied!`);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-800 rounded-2xl skeleton" />)}
        </div>
        <div className="h-96 bg-gray-800 rounded-2xl skeleton" />
      </div>
    );
  }

  const stats = analytics?.summary || {};

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 mt-1">Manage your quizzes and track student performance</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            to="/teacher/ai-generator"
            className="flex items-center gap-2 gradient-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
          >
            <Brain className="w-4 h-4" /> AI Generator
          </Link>
          <Link
            to="/teacher/create-quiz"
            className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Create Quiz
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Total Quizzes" value={stats.totalQuizzes || 0} color="bg-indigo-500/10 text-indigo-400" sub={`${stats.publishedQuizzes || 0} published`} />
        <StatCard icon={Users} label="Total Students" value={stats.totalStudents || 0} color="bg-violet-500/10 text-violet-400" />
        <StatCard icon={TrendingUp} label="Total Attempts" value={stats.totalAttempts || 0} color="bg-green-500/10 text-green-400" />
        <StatCard icon={BarChart3} label="Avg. Score" value={`${stats.averageScore || 0}%`} color="bg-amber-500/10 text-amber-400" />
      </div>

      {/* Quiz list */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white">Your Quizzes</h2>
          <span className="text-xs text-gray-500">{quizzes.length} total</span>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No quizzes yet</p>
            <p className="text-gray-600 text-sm mb-6">Create your first quiz or generate one with AI</p>
            <Link to="/teacher/ai-generator" className="gradient-primary text-white px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
              <Brain className="w-4 h-4" /> Generate with AI
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {quizzes.map((quiz) => (
              <div key={quiz._id} className="p-4 hover:bg-gray-800/50 transition-colors flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-white truncate">{quiz.title}</h3>
                    <StatusBadge status={quiz.status} />
                    {quiz.isAIGenerated && (
                      <span className="bg-violet-500/10 text-violet-400 border border-violet-500/30 text-xs px-2 py-0.5 rounded-full">AI</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                    <span>{quiz.questions?.length || 0} questions</span>
                    <span>{quiz.duration}min</span>
                    <span>{quiz.totalAttempts || 0} attempts</span>
                    {quiz.status === 'published' && (
                      <button
                        onClick={() => copyCode(quiz.quizCode)}
                        className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                      >
                        <Share2 className="w-3 h-3" /> {quiz.quizCode}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {quiz.status === 'draft' && quiz.questions?.length > 0 && (
                    <button
                      onClick={() => handlePublish(quiz._id)}
                      className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-xs"
                      title="Publish"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <Link
                    to={`/teacher/quiz/${quiz._id}/edit`}
                    className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  {quiz.status === 'published' && (
                    <Link
                      to={`/teacher/quiz/${quiz._id}/leaderboard`}
                      className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-indigo-400 hover:bg-gray-700 transition-colors"
                      title="Leaderboard"
                    >
                      <Trophy className="w-4 h-4" />
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(quiz._id)}
                    className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Performers */}
      {analytics?.topPerformers?.length > 0 && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800">
          <div className="p-5 border-b border-gray-800">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" /> Top Performers
            </h2>
          </div>
          <div className="divide-y divide-gray-800">
            {analytics.topPerformers.map((student, i) => (
              <div key={student.email} className="flex items-center gap-4 p-4">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-gray-500/20 text-gray-400' : 'bg-amber-800/20 text-amber-700'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm">{student.name}</p>
                  <p className="text-gray-500 text-xs">{student.attempts} attempts</p>
                </div>
                <span className="text-indigo-400 font-semibold text-sm">{student.averageScore.toFixed(1)} avg pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
