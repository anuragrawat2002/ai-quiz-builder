import { Outlet, Link } from 'react-router-dom';
import { Brain } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-primary items-center justify-center p-12">
        <div className="absolute inset-0 opacity-20">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/30"
              style={{
                width: `${200 + i * 100}px`,
                height: `${200 + i * 100}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
        <div className="relative text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur">
            <Brain className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4">AI Quiz Builder</h1>
          <p className="text-white/80 text-lg max-w-sm">
            Generate intelligent quizzes with AI. Engage students with real-time leaderboards.
          </p>
          <div className="mt-10 flex flex-col gap-3 text-left max-w-xs mx-auto">
            {['✦ AI-powered quiz generation', '✦ Real-time leaderboards', '✦ Detailed analytics', '✦ Smart assessment tools'].map(f => (
              <p key={f} className="text-white/70 text-sm">{f}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-gradient">QuizAI</span>
          </Link>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
