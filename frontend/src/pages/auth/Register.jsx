import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, GraduationCap, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: searchParams.get('role') || 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('All fields required');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      toast.success(`Account created! Welcome, ${user.name}!`);
      navigate(user.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
        <p className="text-gray-400">Join QuizAI and start learning smarter</p>
      </div>

      {/* Role selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { value: 'teacher', label: 'Educator', Icon: BookOpen, desc: 'Create & manage quizzes' },
          { value: 'student', label: 'Student', Icon: GraduationCap, desc: 'Attempt quizzes & learn' },
        ].map(({ value, label, Icon, desc }) => (
          <button
            key={value}
            type="button"
            onClick={() => setForm({ ...form, role: value })}
            className={`p-4 rounded-xl border text-left transition-all ${
              form.role === value
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
            }`}
          >
            <Icon className={`w-5 h-5 mb-2 ${form.role === value ? 'text-indigo-400' : 'text-gray-500'}`} />
            <p className={`font-semibold text-sm ${form.role === value ? 'text-white' : 'text-gray-400'}`}>{label}</p>
            <p className="text-xs text-gray-600 mt-0.5">{desc}</p>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { field: 'name', label: 'Full Name', icon: User, type: 'text', placeholder: 'John Doe' },
          { field: 'email', label: 'Email', icon: Mail, type: 'email', placeholder: 'you@example.com' },
        ].map(({ field, label, icon: Icon, type, placeholder }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
            <div className="relative">
              <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={type}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-gray-600"
              />
            </div>
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 6 characters"
              className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-gray-600"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full gradient-primary text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
