import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Brain, PlusCircle, BarChart3, LogOut,
  Menu, X, User, Moon, Sun, BookOpen, Trophy, Zap,
  Users, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const teacherNav = [
  { path: '/teacher', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/teacher/create-quiz', icon: PlusCircle, label: 'Create Quiz' },
  { path: '/teacher/ai-generator', icon: Brain, label: 'AI Generator' },
  { path: '/teacher/analytics', icon: BarChart3, label: 'Analytics' },
];

const studentNav = [
  { path: '/student', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/student/join', icon: Zap, label: 'Join Quiz' },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = user?.role === 'teacher' ? teacherNav : studentNav;

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen flex ${isDark ? 'dark bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col
        ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-800/50">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-gradient">QuizAI</span>
              <p className="text-xs text-gray-500 -mt-0.5">
                {user?.role === 'teacher' ? 'Educator' : 'Student'} Portal
              </p>
            </div>
          </Link>
        </div>

        {/* User card */}
        <div className={`mx-4 mt-4 p-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'} flex items-center gap-3`}>
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 px-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Menu
          </p>
          {navItems.map(({ path, icon: Icon, label, exact }) => {
            const active = isActive(path, exact);
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${active
                    ? 'gradient-primary text-white shadow-lg shadow-indigo-500/25'
                    : isDark
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}

          <div className="border-t border-gray-800/50 my-3" />
          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 px-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Account
          </p>

          <Link
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
          >
            <User className="w-4 h-4" /> Profile
          </Link>
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-gray-800/50 flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm transition-all
              ${isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900'}`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDark ? 'Light' : 'Dark'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className={`lg:hidden flex items-center justify-between px-4 py-3 border-b
          ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-gradient">QuizAI</span>
          <button onClick={toggleTheme} className="p-2 rounded-lg">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
