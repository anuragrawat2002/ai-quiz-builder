
import jsPDF from 'jspdf';

/**
 * Generates and downloads a quiz completion certificate as PDF.
 * Only call this when student percentage >= 60.
 *
 * @param {Object} params
 * @param {string} params.studentName
 * @param {string} params.quizTitle
 * @param {number} params.score
 * @param {number} params.totalMarks
 * @param {number} params.percentage
 * @param {string} params.submittedAt  ISO date string
 * @param {number|null} params.rank
 */
export const generateCertificate = ({
  studentName,
  quizTitle,
  score,
  totalMarks,
  percentage,
  submittedAt,
  rank,
}) => {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const W = 297; // A4 landscape width  (mm)
  const H = 210; // A4 landscape height (mm)

  // ─── Background ───────────────────────────────────────────────────────────
  pdf.setFillColor(8, 10, 26);
  pdf.rect(0, 0, W, H, 'F');

  // Subtle dot grid
  for (let x = 14; x < W; x += 20) {
    for (let y = 14; y < H; y += 20) {
      pdf.setFillColor(25, 30, 70);
      pdf.circle(x, y, 0.55, 'F');
    }
  }

  // ─── Double gold border ───────────────────────────────────────────────────
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(1.6);
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
  corner(11, 11, 1, 1);
  corner(W - 11, 11, -1, 1);
  corner(11, H - 11, 1, -1);
  corner(W - 11, H - 11, -1, -1);

  // ─── Top indigo accent bar ────────────────────────────────────────────────
  pdf.setFillColor(99, 102, 241);
  pdf.rect(11, 11, W - 22, 2.5, 'F');

  // ─── Logo circle ──────────────────────────────────────────────────────────
  // Outer glow ring
  pdf.setFillColor(40, 35, 90);
  pdf.circle(W / 2, 34, 12, 'F');
  // Main circle
  pdf.setFillColor(99, 102, 241);
  pdf.circle(W / 2, 34, 10, 'F');
  // "AI" text inside
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AI', W / 2, 37, { align: 'center' });

  // Brand name
  pdf.setTextColor(99, 102, 241);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('QuizAI', W / 2, 50, { align: 'center' });

  // ─── Title ────────────────────────────────────────────────────────────────
  pdf.setTextColor(212, 175, 55);
  pdf.setFontSize(9.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text('C E R T I F I C A T E   O F   A C H I E V E M E N T', W / 2, 61, { align: 'center' });

  // Gold divider
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(0.35);
  pdf.line(W / 2 - 58, 64.5, W / 2 + 58, 64.5);

  // ─── "This is to certify that" ────────────────────────────────────────────
  pdf.setTextColor(140, 150, 195);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('This is to certify that', W / 2, 74, { align: 'center' });

  // ─── Student name ─────────────────────────────────────────────────────────
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(26);
  pdf.setFont('helvetica', 'bold');
  pdf.text(studentName, W / 2, 88, { align: 'center' });

  // Indigo underline
  const nw = pdf.getTextWidth(studentName);
  pdf.setDrawColor(99, 102, 241);
  pdf.setLineWidth(0.7);
  pdf.line(W / 2 - nw / 2, 90.5, W / 2 + nw / 2, 90.5);

  // ─── Sub-text ─────────────────────────────────────────────────────────────
  pdf.setTextColor(140, 150, 195);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('has successfully completed the quiz', W / 2, 100, { align: 'center' });

  // ─── Quiz title ───────────────────────────────────────────────────────────
  pdf.setTextColor(167, 139, 250); // violet-400
  pdf.setFontSize(15);
  pdf.setFont('helvetica', 'bold');
  const title = quizTitle.length > 62 ? quizTitle.slice(0, 59) + '…' : quizTitle;
  pdf.text(`"${title}"`, W / 2, 112, { align: 'center' });

  // ─── Score badges ─────────────────────────────────────────────────────────
  const badgeY = 126;
  const badges = [
    { label: 'SCORE',      value: `${score} / ${totalMarks}` },
    { label: 'PERCENTAGE', value: `${percentage}%`           },
    { label: 'GRADE',      value: gradeLabel(percentage)     },
    { label: 'RANK',       value: rank ? `#${rank}` : '—'   },
    { label: 'STATUS',     value: 'PASSED ✓'                 },
  ];

  const bW = 36;
  const bGap = 5;
  const totalBW = badges.length * bW + (badges.length - 1) * bGap;
  let bx = W / 2 - totalBW / 2;

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

  // ─── Date issued ──────────────────────────────────────────────────────────
  const dateStr = new Date(submittedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  pdf.setTextColor(100, 110, 170);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Issued on ${dateStr}`, W / 2, 153, { align: 'center' });

  // ─── Signature line ───────────────────────────────────────────────────────
  // Left: platform seal
  pdf.setDrawColor(212, 175, 55);
  pdf.setLineWidth(0.3);
  pdf.line(40, 165, 100, 165);
  pdf.setTextColor(100, 110, 170);
  pdf.setFontSize(7);
  pdf.text('QuizAI Platform', 70, 169, { align: 'center' });

  // Right: date line
  pdf.line(W - 100, 165, W - 40, 165);
  pdf.text(dateStr, W - 70, 169, { align: 'center' });

  // ─── Footer ───────────────────────────────────────────────────────────────
  pdf.setDrawColor(25, 30, 70);
  pdf.setLineWidth(0.3);
  pdf.line(18, 177, W - 18, 177);

  pdf.setTextColor(45, 50, 100);
  pdf.setFontSize(6.5);
  pdf.text(
    'Generated by QuizAI · AI-Powered Quiz Platform · This certificate confirms passing score of 60% or above.',
    W / 2, 182, { align: 'center' }
  );

  // ─── Bottom accent bar ────────────────────────────────────────────────────
  pdf.setFillColor(99, 102, 241);
  pdf.rect(11, H - 13, W - 22, 2.5, 'F');

  // ─── Save ─────────────────────────────────────────────────────────────────
  const safe = studentName.replace(/[^a-zA-Z0-9]/g, '_');
  pdf.save(`QuizAI_Certificate_${safe}.pdf`);
};

/** Returns A / B / C / D grade based on percentage */
const gradeLabel = (pct) => {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  return 'F';
};