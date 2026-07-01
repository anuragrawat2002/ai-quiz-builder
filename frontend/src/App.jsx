import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';

import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import CreateQuiz from './pages/teacher/CreateQuiz';
import AIQuizGenerator from './pages/teacher/AIQuizGenerator';
import QuizEditor from './pages/teacher/QuizEditor';
import QuizAttempt from './pages/quiz/QuizAttempt';
import LeaderboardPage from './pages/quiz/LeaderboardPage';
import AnalyticsPage from './pages/teacher/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import JoinQuiz from './pages/student/JoinQuiz';
import AttemptResult from './pages/quiz/AttemptResult';

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />;
  }
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={user ? <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} /> : <Register />} />
      </Route>
      <Route element={<MainLayout />}>
        <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/teacher/create-quiz" element={<ProtectedRoute roles={['teacher']}><CreateQuiz /></ProtectedRoute>} />
        <Route path="/teacher/ai-generator" element={<ProtectedRoute roles={['teacher']}><AIQuizGenerator /></ProtectedRoute>} />
        <Route path="/teacher/quiz/:id/edit" element={<ProtectedRoute roles={['teacher']}><QuizEditor /></ProtectedRoute>} />
        <Route path="/teacher/analytics" element={<ProtectedRoute roles={['teacher']}><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/teacher/quiz/:id/leaderboard" element={<ProtectedRoute roles={['teacher']}><LeaderboardPage /></ProtectedRoute>} />
        <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/join" element={<ProtectedRoute roles={['student']}><JoinQuiz /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/quiz/:id/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
      </Route>
      <Route path="/quiz/:id/attempt" element={<ProtectedRoute roles={['student']}><QuizAttempt /></ProtectedRoute>} />
      <Route path="/attempt/:id/result" element={<ProtectedRoute><AttemptResult /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151', borderRadius: '12px' },
                success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
              }}
            />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
