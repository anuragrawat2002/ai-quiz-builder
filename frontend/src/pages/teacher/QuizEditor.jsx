import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Edit3, Save, CheckCircle,
  ChevronDown, ChevronUp, Brain, Settings, Eye,
  GripVertical, AlertCircle, Share2, Clock, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { quizService } from '../../services/api';

const DIFFICULTY_COLORS = {
  easy: 'text-green-400 bg-green-500/10 border-green-500/30',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  hard: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const emptyQuestion = () => ({
  questionText: '',
  options: [
    { label: 'A', text: '' },
    { label: 'B', text: '' },
    { label: 'C', text: '' },
    { label: 'D', text: '' },
  ],
  correctAnswer: 'A',
  difficulty: 'medium',
  explanation: '',
  marks: 1,
});

export default function QuizEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [expandedQ, setExpandedQ] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newQuestion, setNewQuestion] = useState(emptyQuestion());
  const [editingInfo, setEditingInfo] = useState(false);
  const [quizInfo, setQuizInfo] = useState({});

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { data } = await quizService.getById(id);
        setQuiz(data.quiz);
        setQuizInfo({
          title: data.quiz.title,
          description: data.quiz.description,
          duration: data.quiz.duration,
          category: data.quiz.category,
          settings: data.quiz.settings,
        });
      } catch {
        toast.error('Failed to load quiz');
        navigate('/teacher');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      const { data } = await quizService.update(id, quizInfo);
      setQuiz(data.quiz);
      setEditingInfo(false);
      toast.success('Quiz updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.questionText.trim()) return toast.error('Question text required');
    if (newQuestion.options.some(o => !o.text.trim())) return toast.error('All options required');
    setSaving(true);
    try {
      const { data } = await quizService.addQuestion(id, newQuestion);
      setQuiz(data.quiz);
      setNewQuestion(emptyQuestion());
      setAddingNew(false);
      toast.success('Question added!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add question');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (qid) => {
    if (!confirm('Delete this question?')) return;
    try {
      const { data } = await quizService.deleteQuestion(id, qid);
      setQuiz(data.quiz);
      toast.success('Question deleted');
    } catch {
      toast.error('Failed to delete question');
    }
  };

  const handlePublish = async () => {
    if (!quiz?.questions?.length) return toast.error('Add at least one question first');
    setPublishing(true);
    try {
      const { data } = await quizService.publish(id);
      setQuiz(data.quiz);
      toast.success('Quiz published! Share code: ' + data.quiz.quizCode);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const updateNewQuestionOption = (idx, value) => {
    const opts = [...newQuestion.options];
    opts[idx] = { ...opts[idx], text: value };
    setNewQuestion({ ...newQuestion, options: opts });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-800 rounded-2xl skeleton" />)}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/teacher" className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">{quiz?.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium
                ${quiz?.status === 'published' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                  'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'}`}>
                {quiz?.status}
              </span>
              {quiz?.isAIGenerated && (
                <span className="text-xs px-2 py-0.5 rounded-full border bg-violet-500/10 text-violet-400 border-violet-500/30">AI Generated</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {quiz?.status === 'draft' && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 gradient-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {publishing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Publish Quiz
            </button>
          )}
          {quiz?.status === 'published' && (
            <button
              onClick={() => { navigator.clipboard.writeText(quiz.quizCode); toast.success('Code copied!'); }}
              className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              <Share2 className="w-4 h-4" /> {quiz.quizCode}
            </button>
          )}
        </div>
      </div>

      {/* Quiz Info */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white flex items-center gap-2"><Settings className="w-4 h-4 text-indigo-400" /> Quiz Settings</h2>
          {!editingInfo ? (
            <button onClick={() => setEditingInfo(true)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditingInfo(false)} className="text-xs text-gray-500 hover:text-gray-300">Cancel</button>
              <button onClick={handleSaveInfo} disabled={saving} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                {saving ? <div className="w-3 h-3 border border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" /> : <Save className="w-3 h-3" />} Save
              </button>
            </div>
          )}
        </div>

        {editingInfo ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: 'Title', key: 'title', type: 'text' },
              { label: 'Category', key: 'category', type: 'text' },
              { label: 'Duration (minutes)', key: 'duration', type: 'number' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <input
                  type={type}
                  value={quizInfo[key] || ''}
                  onChange={e => setQuizInfo({ ...quizInfo, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea
                value={quizInfo.description || ''}
                onChange={e => setQuizInfo({ ...quizInfo, description: e.target.value })}
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-400 mb-2">Options</label>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'shuffleQuestions', label: 'Shuffle Questions' },
                  { key: 'shuffleOptions', label: 'Shuffle Options' },
                  { key: 'negativeMarking', label: 'Negative Marking' },
                  { key: 'showResults', label: 'Show Results' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quizInfo.settings?.[key] || false}
                      onChange={e => setQuizInfo({ ...quizInfo, settings: { ...quizInfo.settings, [key]: e.target.checked } })}
                      className="accent-indigo-500"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'Duration', value: `${quiz?.duration} min`, icon: Clock },
              { label: 'Questions', value: quiz?.questions?.length || 0, icon: HelpCircle },
              { label: 'Total Marks', value: quiz?.totalMarks || 0, icon: Brain },
              { label: 'Category', value: quiz?.category || 'General', icon: Eye },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-gray-800 rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1">{label}</p>
                <p className="font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white">Questions ({quiz?.questions?.length || 0})</h2>
          <button
            onClick={() => { setAddingNew(true); setExpandedQ(null); }}
            className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>

        <div className="divide-y divide-gray-800">
          {quiz?.questions?.map((q, idx) => (
            <div key={q._id} className="p-4">
              <div
                className="flex items-start gap-3 cursor-pointer"
                onClick={() => setExpandedQ(expandedQ === q._id ? null : q._id)}
              >
                <span className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium line-clamp-2">{q.questionText}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[q.difficulty]}`}>
                      {q.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-gray-600">Ans: {q.correctAnswer}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q._id); }}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {expandedQ === q._id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </div>
              </div>

              {expandedQ === q._id && (
                <div className="mt-4 ml-10 space-y-2">
                  {q.options.map((opt) => (
                    <div key={opt.label} className={`flex items-center gap-2 p-2.5 rounded-xl text-sm border
                      ${opt.label === q.correctAnswer ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${opt.label === q.correctAnswer ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                        {opt.label}
                      </span>
                      {opt.text}
                      {opt.label === q.correctAnswer && <span className="ml-auto text-xs text-green-400">✓ Correct</span>}
                    </div>
                  ))}
                  {q.explanation && (
                    <div className="mt-2 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-xs text-gray-400">
                      <span className="text-indigo-400 font-medium">Explanation: </span>{q.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {quiz?.questions?.length === 0 && !addingNew && (
            <div className="text-center py-12">
              <HelpCircle className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No questions yet. Add your first question below.</p>
            </div>
          )}
        </div>

        {/* Add question form */}
        {addingNew && (
          <div className="p-5 border-t border-gray-800 bg-gray-800/30">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> New Question
            </h3>
            <div className="space-y-4">
              <textarea
                value={newQuestion.questionText}
                onChange={e => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                placeholder="Enter your question..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 resize-none transition-colors placeholder-gray-600"
              />

              <div className="grid sm:grid-cols-2 gap-3">
                {newQuestion.options.map((opt, i) => (
                  <div key={opt.label} className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${newQuestion.correctAnswer === opt.label ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                      {opt.label}
                    </span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={e => updateNewQuestionOption(i, e.target.value)}
                      placeholder={`Option ${opt.label}`}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-12 pr-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600"
                    />
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Correct Answer</label>
                  <select
                    value={newQuestion.correctAnswer}
                    onChange={e => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {['A', 'B', 'C', 'D'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Difficulty</label>
                  <select
                    value={newQuestion.difficulty}
                    onChange={e => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option>easy</option><option>medium</option><option>hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuestion.marks}
                    onChange={e => setNewQuestion({ ...newQuestion, marks: Number(e.target.value) })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <input
                type="text"
                value={newQuestion.explanation}
                onChange={e => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                placeholder="Explanation (optional)"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600"
              />

              <div className="flex gap-2 justify-end">
                <button onClick={() => { setAddingNew(false); setNewQuestion(emptyQuestion()); }} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleAddQuestion}
                  disabled={saving}
                  className="flex items-center gap-2 gradient-primary text-white px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Add Question
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
