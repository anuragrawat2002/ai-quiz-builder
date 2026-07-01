import { Link } from 'react-router-dom';
import { Brain, Zap, Trophy, BarChart3, Users, Shield, ArrowRight, Star } from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI Quiz Generation', desc: 'Generate professional quizzes from any topic using Google Gemini AI.' },
  { icon: Zap, title: 'Real-time Leaderboard', desc: 'Live rankings update instantly as students submit their answers.' },
  { icon: BarChart3, title: 'Smart Analytics', desc: 'Deep insights into student performance and quiz effectiveness.' },
  { icon: Shield, title: 'Secure & Reliable', desc: 'JWT authentication and role-based access keep your data safe.' },
  { icon: Users, title: 'Multi-role Support', desc: 'Separate dashboards for educators and students with tailored features.' },
  { icon: Trophy, title: 'Gamified Learning', desc: 'Points, ranks, and certificates motivate students to perform better.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-gradient">QuizAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-gray-400 hover:text-white text-sm transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link to="/register" className="gradient-primary text-white text-sm px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-2 text-sm text-indigo-300 mb-6">
            <Star className="w-3.5 h-3.5" />
            Powered by Google Gemini AI
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Build Smarter
            <span className="block text-gradient">Quizzes with AI</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Generate professional MCQ quizzes instantly using AI. Run live quiz sessions with real-time leaderboards and deep performance analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register?role=teacher"
              className="gradient-primary text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-2xl shadow-indigo-500/30"
            >
              Start as Educator <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/register?role=student"
              className="border border-gray-700 text-gray-300 px-8 py-4 rounded-2xl font-semibold text-lg hover:border-indigo-500 hover:text-white transition-all"
            >
              Join as Student
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[['AI-Powered', 'Quiz Generation'], ['Real-time', 'Leaderboards'], ['Deep', 'Analytics']].map(([label, sub]) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-gradient">{label}</p>
                <p className="text-gray-500 text-sm">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything you need</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              A complete platform for creating and running intelligent assessments.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to transform your classroom?</h2>
            <p className="text-gray-400 mb-8">Join educators using AI to create engaging quizzes in seconds.</p>
            <Link
              to="/register"
              className="gradient-primary text-white px-8 py-4 rounded-2xl font-semibold text-lg inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6 text-center text-gray-500 text-sm">
        <p>© 2025 QuizAI — AI-Powered Quiz Builder. Built with React, Node.js & Gemini AI.</p>
      </footer>
    </div>
  );
}
