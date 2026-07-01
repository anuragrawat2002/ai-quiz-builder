import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { BarChart3, TrendingUp, Users, BookOpen, Trophy, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { analyticsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-gray-400 text-sm">{label}</p>
    {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm">
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-white font-semibold">{payload[0].value}{payload[0].name === 'averageScore' ? '%' : ''}</p>
    </div>
  );
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const fn = user.role === 'teacher' ? analyticsService.getTeacher : analyticsService.getStudent;
        const res = await fn();
        setData(res.data);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user.role]);

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-800 rounded-2xl skeleton" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="h-72 bg-gray-800 rounded-2xl skeleton" />
          <div className="h-72 bg-gray-800 rounded-2xl skeleton" />
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};

  if (user.role === 'teacher') {
    return (
      <div className="max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Overview of all your quizzes and students</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={BookOpen} label="Total Quizzes" value={summary.totalQuizzes || 0} color="bg-indigo-500/10 text-indigo-400" sub={`${summary.publishedQuizzes || 0} published`} />
          <StatCard icon={Users} label="Students" value={summary.totalStudents || 0} color="bg-violet-500/10 text-violet-400" />
          <StatCard icon={TrendingUp} label="Total Attempts" value={summary.totalAttempts || 0} color="bg-green-500/10 text-green-400" />
          <StatCard icon={Target} label="Average Score" value={`${summary.averageScore || 0}%`} color="bg-amber-500/10 text-amber-400" />
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Score Distribution */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-5">Score Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.scoreDistribution || []}>
                <XAxis dataKey="range" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quiz Performance */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-5">Quiz Average Scores</h3>
            {data?.quizPerformance?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.quizPerformance.slice(0, 6)} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <YAxis dataKey="title" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="averageScore" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-600 text-sm">No quiz data yet</div>
            )}
          </div>
        </div>

        {/* Top performers */}
        {data?.topPerformers?.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> Top Performers</h3>
            <div className="space-y-3">
              {data.topPerformers.map((s, i) => (
                <div key={s.email} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-gray-400/20 text-gray-300' : 'bg-amber-800/20 text-amber-700'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{s.name}</p>
                    <p className="text-gray-500 text-xs">{s.attempts} attempts</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-400 text-sm">{s.averageScore.toFixed(1)}</p>
                    <p className="text-gray-600 text-xs">avg score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Student analytics
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Performance</h1>
        <p className="text-gray-400 text-sm mt-1">Track your quiz history and improvements</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Quizzes Taken" value={summary.totalAttempts || 0} color="bg-indigo-500/10 text-indigo-400" />
        <StatCard icon={Target} label="Average Score" value={`${summary.averageScore || 0}%`} color="bg-violet-500/10 text-violet-400" />
        <StatCard icon={Trophy} label="Best Score" value={`${summary.bestScore || 0}%`} color="bg-amber-500/10 text-amber-400" />
        <StatCard icon={TrendingUp} label="Pass Rate" value={`${summary.passRate || 0}%`} color="bg-green-500/10 text-green-400" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Performance trend */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-5">Score Trend</h3>
          {data?.trend?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="quiz" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">No attempts yet</div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-5">By Category</h3>
          {data?.categoryBreakdown?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.categoryBreakdown} dataKey="attempts" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                  {data.categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n, p) => [`${p.payload.averageScore}% avg`, p.payload.name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Recent attempts */}
      {data?.recentAttempts?.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4">Recent Attempts</h3>
          <div className="space-y-3">
            {data.recentAttempts.map((a) => (
              <div key={a._id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{a.quizId?.title || 'Unknown Quiz'}</p>
                  <p className="text-gray-500 text-xs">{new Date(a.submittedAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${a.passed ? 'text-green-400' : 'text-red-400'}`}>{a.percentage}%</p>
                  <p className="text-gray-600 text-xs">{a.passed ? 'Passed' : 'Failed'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
