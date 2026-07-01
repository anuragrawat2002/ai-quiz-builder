
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Trophy, CheckCircle, XCircle, ArrowRight,
  ChevronDown, ChevronUp, Download, Award, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import { attemptService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';


// ---------------------------------------------------------------------------
// Certificate generator — embeds the real QuizAI logo PNG into the PDF
// ---------------------------------------------------------------------------
const downloadCertificate = async ({
  studentName, quizTitle, score, totalMarks, percentage, submittedAt, rank
}) => {
  const { default: jsPDF } = await import('jspdf');

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297;
  const H = 210;

  // ── Background ────────────────────────────────────────────────────────────
  pdf.setFillColor(8, 10, 26);
  pdf.rect(0, 0, W, H, 'F');

  // Dot grid pattern
  for (let x = 14; x < W; x += 20) {
    for (let y = 14; y < H; y += 20) {
      pdf.setFillColor(22, 27, 65);
      pdf.circle(x, y, 0.5, 'F');
    }
  }

  // ── Outer gold double border ───────────────────────────────────────────────
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(1.8);
  pdf.rect(7, 7, W - 14, H - 14);
  pdf.setLineWidth(0.45);
  pdf.rect(11, 11, W - 22, H - 22);

  // Corner L-brackets
  const corner = (x, y, dx, dy) => {
    pdf.setDrawColor(212, 175, 55);
    pdf.setLineWidth(1.3);
    pdf.line(x, y, x + dx * 14, y);
    pdf.line(x, y, x, y + dy * 14);
  };
  corner(11, 11,  1,  1);
  corner(W - 11, 11, -1,  1);
  corner(11, H - 11,  1, -1);
  corner(W - 11, H - 11, -1, -1);

  // ── Top indigo accent strip ────────────────────────────────────────────────
  pdf.setFillColor(99, 102, 241);
  pdf.rect(11, 11, W - 22, 3, 'F');

  // ── Real QuizAI logo image ────────────────────────────────────────────────
  // Rounded purple square background behind logo
  pdf.setFillColor(99, 102, 241);
  pdf.roundedRect(W / 2 - 12, 20, 24, 24, 5, 5, 'F');
  // Place the actual PNG logo on top
  //pdf.addImage(LOGO_BASE64, 'PNG', W / 2 - 12, 20, 24, 24);

  // ── "QuizAI" brand text ────────────────────────────────────────────────────
  pdf.setTextColor(167, 139, 250); // violet-400
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('QuizAI', W / 2, 52, { align: 'center' });

  // ── Certificate heading ────────────────────────────────────────────────────
  pdf.setTextColor(212, 175, 55);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('C E R T I F I C A T E   O F   A C H I E V E M E N T', W / 2, 62, { align: 'center' });

  // Gold divider line
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(0.35);
  pdf.line(W / 2 - 60, 65.5, W / 2 + 60, 65.5);

  // ── "This is to certify that" ─────────────────────────────────────────────
  pdf.setTextColor(140, 150, 195);
  pdf.setFontSize(9);
  pdf.text('This is to certify that', W / 2, 75, { align: 'center' });

  // ── Student name ──────────────────────────────────────────────────────────
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(27);
  pdf.setFont('helvetica', 'bold');
  pdf.text(studentName, W / 2, 89, { align: 'center' });

  // Indigo underline below name
  const nw = pdf.getTextWidth(studentName);
  pdf.setDrawColor(99, 102, 241);
  pdf.setLineWidth(0.7);
  pdf.line(W / 2 - nw / 2, 91.5, W / 2 + nw / 2, 91.5);

  // ── Sub-text ──────────────────────────────────────────────────────────────
  pdf.setTextColor(140, 150, 195);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('has successfully completed the quiz', W / 2, 101, { align: 'center' });

  // ── Quiz title ────────────────────────────────────────────────────────────
  pdf.setTextColor(167, 139, 250);
  pdf.setFontSize(15);
  pdf.setFont('helvetica', 'bold');
  const title = quizTitle.length > 62 ? quizTitle.slice(0, 59) + '...' : quizTitle;
  pdf.text('"' + title + '"', W / 2, 113, { align: 'center' });

  // ── Score badge row ───────────────────────────────────────────────────────
  const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : 'C';
  const badges = [
    { label: 'SCORE',      value: score + ' / ' + totalMarks },
    { label: 'PERCENTAGE', value: percentage + '%'           },
    { label: 'GRADE',      value: grade                      },
    { label: 'RANK',       value: rank ? '#' + rank : '-'   },
    { label: 'STATUS',     value: 'PASSED'                   },
  ];

  const badgeY  = 125;
  const bW      = 36;
  const bGap    = 5;
  const totalBW = badges.length * bW + (badges.length - 1) * bGap;
  let   bx      = W / 2 - totalBW / 2;

  badges.forEach(({ label, value }) => {
    pdf.setFillColor(16, 20, 55);
    pdf.setDrawColor(99, 102, 241);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(bx, badgeY, bW, 18, 3, 3, 'FD');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(value, bx + bW / 2, badgeY + 8, { align: 'center' });

    pdf.setTextColor(100, 110, 170);
    pdf.setFontSize(5.8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(label, bx + bW / 2, badgeY + 14.5, { align: 'center' });

    bx += bW + bGap;
  });

  // ── Date ──────────────────────────────────────────────────────────────────
  const dateStr = new Date(submittedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  pdf.setTextColor(100, 110, 170);
  pdf.setFontSize(8);
  pdf.text('Issued on ' + dateStr, W / 2, 152, { align: 'center' });

  // ── Signature lines ───────────────────────────────────────────────────────
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(0.3);
  pdf.line(38, 164, 100, 164);
  pdf.setTextColor(100, 110, 170);
  pdf.setFontSize(7);
  pdf.text('QuizAI Platform', 69, 168.5, { align: 'center' });

  pdf.line(W - 100, 164, W - 38, 164);
  pdf.text(dateStr, W - 69, 168.5, { align: 'center' });

  // ── Footer ────────────────────────────────────────────────────────────────
  pdf.setDrawColor(22, 27, 65);
  pdf.setLineWidth(0.3);
  pdf.line(18, 176, W - 18, 176);

  pdf.setTextColor(42, 48, 95);
  pdf.setFontSize(6.5);
  pdf.text(
    'Generated by QuizAI · AI-Powered Quiz Platform · Confirms passing score of 60% or above.',
    W / 2, 181, { align: 'center' }
  );

  // ── Bottom accent strip ───────────────────────────────────────────────────
  pdf.setFillColor(99, 102, 241);
  pdf.rect(11, H - 13, W - 22, 3, 'F');

  // ── Save ──────────────────────────────────────────────────────────────────
  const safeName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
  pdf.save('QuizAI_Certificate_' + safeName + '.pdf');
};

// ---------------------------------------------------------------------------

const PASS_THRESHOLD = 60;

export default function AttemptResult() {
  const { id }   = useParams();
  const { user } = useAuth();
  const [attempt,    setAttempt]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [expandedQ,  setExpandedQ]  = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const loadAttempt = async () => {
      try {
        const { data } = await attemptService.getById(id);
        setAttempt(data.attempt);
      } catch {
        toast.error('Failed to load result');
      } finally {
        setLoading(false);
      }
    };
    loadAttempt();
  }, [id]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading your result...</p>
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!attempt) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Result not found.</p>
          <Link to="/student" className="text-indigo-400 hover:text-indigo-300">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const quiz      = attempt.quizId;
  const pct       = attempt.percentage || 0;
  const passed    = attempt.passed;
  const eligible  = pct >= PASS_THRESHOLD;
  const correct   = attempt.answers ? attempt.answers.filter((a) => a.isCorrect).length : 0;
  const total     = quiz && quiz.questions ? quiz.questions.length : 0;

  const circumference = 2 * Math.PI * 54;
  const strokeDash    = (pct / 100) * circumference;
  const ringColor     = pct >= 80 ? '#22c55e' : pct >= 60 ? '#6366f1' : '#ef4444';

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCertificate({
        studentName: user?.name || 'Student',
        quizTitle:   quiz?.title || 'Quiz',
        score:       attempt.score,
        totalMarks:  attempt.totalMarks,
        percentage:  pct,
        submittedAt: attempt.submittedAt,
        rank:        attempt.rank,
      });
      toast.success('Certificate downloaded!');
    } catch (err) {
      console.error('Certificate error:', err);
      toast.error('Failed to generate certificate. Run: npm install jspdf');
    } finally {
      setDownloading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Score card */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 blur-2xl pointer-events-none"
            style={{ background: 'radial-gradient(circle at 50% 40%, ' + ringColor + ', transparent 70%)' }}
          />

          {/* Progress ring */}
          <div className="relative w-36 h-36 mx-auto mb-5">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#1f2937" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke={ringColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={strokeDash + ' ' + circumference}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white">{pct}%</span>
              <span className={'text-xs font-bold ' + (passed ? 'text-green-400' : 'text-red-400')}>
                {passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-1">{quiz?.title || 'Quiz Result'}</h2>
          <p className="text-gray-500 text-sm mb-6">
            {pct >= 80 ? '🌟 Outstanding! Excellent performance.'
              : pct >= 60 ? '🎉 Great work! You passed this quiz.'
              : '💪 Keep practicing — you can do better!'}
          </p>

          {/* Stat boxes */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-lg font-bold text-white">{attempt.score}/{attempt.totalMarks}</p>
              <p className="text-gray-500 text-xs">Score</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-lg font-bold text-green-400">{correct}</p>
              <p className="text-gray-500 text-xs">Correct</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-lg font-bold text-red-400">{total - correct}</p>
              <p className="text-gray-500 text-xs">Wrong</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-lg font-bold text-white">{attempt.rank ? '#' + attempt.rank : '—'}</p>
              <p className="text-gray-500 text-xs">Rank</p>
            </div>
          </div>

          {/* Certificate banner */}
          {eligible ? (
            <div className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/40 rounded-2xl p-5">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="w-6 h-6 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Certificate Earned!</h3>
                <Star className="w-5 h-5 text-amber-400" style={{ fill: '#f59e0b' }} />
              </div>
              <p className="text-gray-300 text-sm mb-4">
                You scored <span className="text-indigo-300 font-bold">{pct}%</span> — your certificate with the official QuizAI logo is ready to download.
              </p>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                {downloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Certificate (PDF)
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-xl text-sm text-gray-500">
              <Award className="w-4 h-4 shrink-0 text-gray-600" />
              <span>
                Score <span className="text-white font-semibold">60%+</span> to earn a certificate.
                You scored {pct}%{PASS_THRESHOLD - pct > 0 ? ' — only ' + (PASS_THRESHOLD - pct) + '% more needed!' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            to={'/quiz/' + quiz?._id + '/leaderboard'}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Trophy className="w-4 h-4" /> Leaderboard
          </Link>
          <Link
            to="/student"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Answer review */}
        {quiz && quiz.questions && quiz.questions.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-white">Answer Review</h3>
              <span className="text-xs text-gray-500">{correct}/{total} correct</span>
            </div>
            <div className="divide-y divide-gray-800">
              {quiz.questions.map((q) => {
                const ans       = attempt.answers ? attempt.answers.find((a) => a.questionId === q._id) : null;
                const isCorrect = ans ? ans.isCorrect : false;
                const expanded  = expandedQ === q._id;

                return (
                  <div key={q._id}>
                    <button
                      onClick={() => setExpandedQ(expanded ? null : q._id)}
                      className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-800/50 transition-colors"
                    >
                      <div className={'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ' + (isCorrect ? 'bg-green-500/20' : 'bg-red-500/20')}>
                        {isCorrect
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                          : <XCircle    className="w-3.5 h-3.5 text-red-400"   />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium line-clamp-2">{q.questionText}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>
                            Your answer:{' '}
                            <span className={isCorrect ? 'text-green-400' : 'text-red-400'}>
                              {ans && ans.selectedAnswer ? ans.selectedAnswer : 'Not answered'}
                            </span>
                          </span>
                          {!isCorrect && (
                            <span>• Correct: <span className="text-green-400">{q.correctAnswer}</span></span>
                          )}
                        </div>
                      </div>
                      {expanded
                        ? <ChevronUp   className="w-4 h-4 text-gray-500 shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
                    </button>

                    {expanded && (
                      <div className="px-4 pb-4 ml-9 space-y-2">
                        {q.options && q.options.map((opt) => {
                          const isRight  = opt.label === q.correctAnswer;
                          const isChosen = ans && ans.selectedAnswer === opt.label;
                          const isWrong  = isChosen && !isCorrect;
                          return (
                            <div
                              key={opt.label}
                              className={
                                'flex items-center gap-2 p-2.5 rounded-xl text-sm border ' +
                                (isRight  ? 'bg-green-500/10 border-green-500/30 text-green-300'
                                  : isWrong ? 'bg-red-500/10 border-red-500/30 text-red-300'
                                  : 'bg-gray-800 border-gray-700 text-gray-400')
                              }
                            >
                              <span className={
                                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ' +
                                (isRight  ? 'bg-green-500 text-white'
                                  : isWrong ? 'bg-red-500 text-white'
                                  : 'bg-gray-700 text-gray-400')
                              }>
                                {opt.label}
                              </span>
                              <span className="flex-1">{opt.text}</span>
                              {isRight && <span className="ml-auto text-xs text-green-400 shrink-0">✓ Correct</span>}
                            </div>
                          );
                        })}
                        {q.explanation && (
                          <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-xs text-gray-400">
                            <span className="text-indigo-400 font-medium">Explanation: </span>
                            {q.explanation}
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