import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, AlertTriangle, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { quizService, attemptService } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export default function QuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, joinQuizRoom, leaveQuizRoom } = useSocket();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const questionStartTime = useRef(Date.now());
  const timerRef = useRef(null);
  const submitted = useRef(false);

  // Load quiz and start attempt
  useEffect(() => {
    const init = async () => {
      try {
        const [qRes, aRes] = await Promise.all([
          quizService.getById(id),
          attemptService.start(id),
        ]);
        setQuiz(qRes.data.quiz);
        setAttempt(aRes.data.attempt);
        setTimeLeft(qRes.data.quiz.duration * 60);
        joinQuizRoom(id);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to start quiz');
        navigate('/student');
      } finally {
        setLoading(false);
      }
    };
    init();
    return () => {
      leaveQuizRoom(id);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (!timeLeft || !attempt) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!submitted.current) handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [attempt]);

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitted.current || !attempt) return;
    submitted.current = true;
    setSubmitting(true);
    try {
      const answersArr = quiz.questions.map(q => ({
        questionId: q._id,
        selectedAnswer: answers[q._id] || null,
        timeTaken: 0,
      }));
      const { data } = await attemptService.submit(attempt._id, {
        answers: answersArr,
        timeTaken: quiz.duration * 60 - timeLeft,
      });
      if (auto) toast('Time\'s up! Quiz auto-submitted.', { icon: '⏰' });
      else toast.success('Quiz submitted!');
      navigate(`/attempt/${data.attempt._id}/result`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
      submitted.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [attempt, answers, quiz, timeLeft, navigate]);

  const selectAnswer = (questionId, label) => {
    setAnswers(prev => ({ ...prev, [questionId]: label }));
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading quiz...</p>
        </div>
      </div>
    );
  }

  const question = quiz?.questions?.[current];
  const answered = Object.keys(answers).length;
  const total = quiz?.questions?.length || 0;
  const progress = (answered / total) * 100;
  const timerColor = timeLeft < 60 ? 'text-red-400' : timeLeft < 300 ? 'text-amber-400' : 'text-green-400';
  const timerBg = timeLeft < 60 ? 'bg-red-500/10 border-red-500/30' : timeLeft < 300 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-green-500/10 border-green-500/30';

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Top bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{quiz?.title}</p>
            <p className="text-xs text-gray-500">{answered}/{total} answered</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-lg ${timerBg} ${timerColor}`}>
          <Clock className="w-4 h-4" />
          {formatTime(timeLeft)}
        </div>

        <button
          onClick={() => setShowConfirm(true)}
          disabled={submitting}
          className="gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" /> Submit
        </button>
      </header>

      {/* Progress */}
      <div className="h-1 bg-gray-800">
        <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm text-gray-500">Question {current + 1} of {total}</span>
          <span className={`text-xs px-2 py-1 rounded-full border font-medium
            ${question?.difficulty === 'easy' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
              question?.difficulty === 'hard' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
              'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
            {question?.difficulty}
          </span>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 lg:p-7 mb-6">
          <p className="text-white text-lg font-medium leading-relaxed">{question?.questionText}</p>
        </div>

        <div className="space-y-3">
          {question?.options?.map((opt) => {
            const selected = answers[question._id] === opt.label;
            return (
              <button
                key={opt.label}
                onClick={() => selectAnswer(question._id, opt.label)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200
                  ${selected
                    ? 'border-indigo-500 bg-indigo-500/15 shadow-lg shadow-indigo-500/10'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-800/70'
                  }`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all
                  ${selected ? 'gradient-primary text-white' : 'bg-gray-800 text-gray-500'}`}>
                  {opt.label}
                </span>
                <span className={`text-sm font-medium transition-colors ${selected ? 'text-white' : 'text-gray-300'}`}>
                  {opt.text}
                </span>
                {selected && <CheckCircle className="w-4 h-4 text-indigo-400 ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {/* Question dots */}
          <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
            {quiz?.questions?.map((q, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-6 h-6 rounded-full text-xs font-bold transition-all
                  ${i === current ? 'gradient-primary text-white scale-110' :
                    answers[q._id] ? 'bg-indigo-500/30 text-indigo-300' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => current < total - 1 ? setCurrent(c => c + 1) : setShowConfirm(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${current === total - 1 ? 'gradient-primary text-white hover:opacity-90' : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'}`}
          >
            {current === total - 1 ? (<><Send className="w-4 h-4" /> Submit</>) : (<>Next <ChevronRight className="w-4 h-4" /></>)}
          </button>
        </div>
      </main>

      {/* Submit confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Submit Quiz?</h3>
            <p className="text-gray-400 text-sm mb-1">
              You've answered <span className="text-white font-semibold">{answered}</span> of <span className="text-white font-semibold">{total}</span> questions.
            </p>
            {answered < total && (
              <p className="text-amber-400 text-sm mb-4">{total - answered} question(s) unanswered.</p>
            )}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 text-sm transition-colors">
                Keep Going
              </button>
              <button
                onClick={() => { setShowConfirm(false); handleSubmit(false); }}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
