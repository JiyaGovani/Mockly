import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mockly_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const TYPES = ['technical', 'behavioral', 'hr', 'aptitude'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

const BLANK_FORM = {
  text: '',
  role: 'SDE',
  type: 'technical',
  difficulty: 'medium',
  expectedAnswer: '',
  keyPoints: '',
  options: ['', '', '', ''],
  correctOption: 0,
  isActive: true,
};

// ─── Add/Edit Modal ───
function QuestionModal({ question, onClose, onSaved }) {
  const isEdit = !!question?._id;
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          ...question,
          keyPoints: (question.keyPoints || []).join(', '),
          options: question.options?.length ? question.options : ['', '', '', ''],
          correctOption: question.correctOption ?? 0,
        }
      : { ...BLANK_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setOption = (i, val) =>
    setForm((f) => {
      const opts = [...f.options];
      opts[i] = val;
      return { ...f, options: opts };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        keyPoints: form.keyPoints
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        options: form.type === 'aptitude' ? form.options : undefined,
        correctOption: form.type === 'aptitude' ? Number(form.correctOption) : undefined,
      };
      if (isEdit) {
        await api.put(`/admin/questions/${question._id}`, payload);
      } else {
        await api.post('/admin/questions', payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">{isEdit ? 'Edit Question' : 'Add Question'}</h2>
          <button
            id="modal-close"
            onClick={onClose}
            className="text-stone-500 hover:text-stone-800 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Text */}
          <div className="space-y-1">
            <label className="text-xs text-stone-600 font-medium">Question Text *</label>
            <textarea
              id="q-text"
              required
              rows={3}
              value={form.text}
              onChange={(e) => set('text', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-900/50 resize-none shadow-sm"
              placeholder="Enter question text…"
            />
          </div>

          {/* Role / Type / Difficulty */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'q-role', label: 'Role *', key: 'role', options: ['SDE', 'DATA SCIENTIST', 'PM', 'DATA ANALYST'] },
              { id: 'q-type', label: 'Type *', key: 'type', options: TYPES },
              { id: 'q-difficulty', label: 'Difficulty *', key: 'difficulty', options: DIFFICULTIES },
            ].map(({ id, label, key, options }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs text-stone-600 font-medium">{label}</label>
                <select
                  id={id}
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-900/50 shadow-sm"
                >
                  {options.map((o) => (
                    <option key={o} value={o} className="bg-white">
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Expected Answer */}
          <div className="space-y-1">
            <label className="text-xs text-stone-600 font-medium">Expected Answer</label>
            <textarea
              id="q-expected"
              rows={2}
              value={form.expectedAnswer}
              onChange={(e) => set('expectedAnswer', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-900/50 resize-none shadow-sm"
              placeholder="Model answer for AI grading…"
            />
          </div>

          {/* Key Points */}
          <div className="space-y-1">
            <label className="text-xs text-stone-600 font-medium">Key Points (comma-separated)</label>
            <input
              id="q-keypoints"
              type="text"
              value={form.keyPoints}
              onChange={(e) => set('keyPoints', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-900/50 shadow-sm"
              placeholder="keyword1, keyword2, keyword3…"
            />
          </div>

          {/* MCQ Options (aptitude only) */}
          {form.type === 'aptitude' && (
            <div className="space-y-3 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
              <p className="text-xs text-orange-850 font-semibold uppercase tracking-wider">MCQ Options</p>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="radio"
                    id={`q-correct-${i}`}
                    name="correctOption"
                    checked={form.correctOption === i}
                    onChange={() => set('correctOption', i)}
                    className="accent-orange-650"
                  />
                  <input
                    id={`q-option-${i}`}
                    type="text"
                    value={opt}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-orange-500/50 shadow-sm"
                  />
                </div>
              ))}
              <p className="text-xs text-stone-500">Select the radio button next to the correct option.</p>
            </div>
          )}

          {/* isActive */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              id="q-active"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              className="w-4 h-4 accent-indigo-500"
            />
            <span className="text-sm text-stone-700">Active (visible to students)</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-200 transition-all"
            >
              Cancel
            </button>
            <button
              id="btn-save-question"
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-900 to-amber-700 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirmation ───
function DeleteConfirm({ question, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/questions/${question._id}`);
      onDeleted();
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-sm p-6 space-y-5">
        <h2 className="text-lg font-bold text-stone-900">Deactivate Question?</h2>
        <p className="text-sm text-stone-600">
          This question will be set to <span className="text-red-700 font-semibold">inactive</span> and hidden from students. You can reactivate it later.
        </p>
        <p className="text-xs text-stone-600 bg-stone-100 border border-stone-200 p-3 rounded-lg line-clamp-2">{question.text}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-650 text-sm hover:bg-stone-200 transition-all">
            Cancel
          </button>
          <button
            id="btn-confirm-delete"
            disabled={deleting}
            onClick={handleDelete}
            className="flex-1 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
          >
            {deleting ? 'Deactivating…' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Import Panel ───
function BulkImportPanel({ onImported }) {
  const [json, setJson] = useState('');
  const [preview, setPreview] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleParse = () => {
    setParseError(null);
    setResult(null);
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) throw new Error('Must be a JSON array of question objects');
      setPreview(parsed);
    } catch (e) {
      setParseError(e.message);
      setPreview(null);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const { data } = await api.post('/admin/questions/bulk', { questions: preview });
      setResult(data.message);
      setJson('');
      setPreview(null);
      onImported();
    } catch (err) {
      setParseError(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-stone-850">Bulk Import (JSON)</h3>
      <p className="text-xs text-stone-500">
        Paste a JSON array of question objects. Each must have: <code className="text-amber-900 bg-stone-100 px-1 py-0.5 rounded font-mono text-xs">text</code>, <code className="text-amber-900 bg-stone-100 px-1 py-0.5 rounded font-mono text-xs">role</code>, <code className="text-amber-900 bg-stone-100 px-1 py-0.5 rounded font-mono text-xs">type</code>, <code className="text-amber-900 bg-stone-100 px-1 py-0.5 rounded font-mono text-xs">difficulty</code>.
      </p>
      <textarea
        id="bulk-import-textarea"
        rows={8}
        value={json}
        onChange={(e) => { setJson(e.target.value); setPreview(null); setResult(null); }}
        className="w-full px-3 py-2 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-800 font-mono placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-900/50 resize-y shadow-inner"
        placeholder={'[\n  {\n    "text": "What is Big O notation?",\n    "role": "SDE",\n    "type": "technical",\n    "difficulty": "easy",\n    "expectedAnswer": "...",\n    "keyPoints": ["time complexity", "space complexity"]\n  }\n]'}
      />
      {parseError && <p className="text-xs text-red-500">⚠ {parseError}</p>}
      {result && <p className="text-xs text-emerald-700 font-semibold">✓ {result}</p>}
      {preview && (
        <p className="text-xs text-amber-900 font-semibold">
          ✓ Parsed {preview.length} question{preview.length !== 1 ? 's' : ''} — ready to import
        </p>
      )}
      <div className="flex gap-3">
        <button
          id="btn-parse-json"
          onClick={handleParse}
          disabled={!json.trim()}
          className="px-4 py-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 text-sm hover:bg-stone-200 transition-all disabled:opacity-30"
        >
          Parse & Preview
        </button>
        <button
          id="btn-bulk-import"
          onClick={handleImport}
          disabled={!preview || importing}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-900 to-amber-700 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-30"
        >
          {importing ? 'Importing…' : `Import ${preview ? preview.length : ''} Questions`}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───
const DIFF_COLORS = {
  easy: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-850',
  hard: 'bg-red-100 text-red-850',
};
const TYPE_COLORS = {
  technical: 'bg-blue-100 text-blue-800',
  behavioral: 'bg-purple-100 text-purple-800',
  hr: 'bg-teal-100 text-teal-800',
  aptitude: 'bg-orange-100 text-orange-800',
};

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDiff, setFilterDiff] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | { question } | 'delete:{q}' | 'bulk'
  const [editQ, setEditQ] = useState(null);
  const [deleteQ, setDeleteQ] = useState(null);
  const [showBulk, setShowBulk] = useState(false);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (filterType) params.append('type', filterType);
      if (filterDiff) params.append('difficulty', filterDiff);
      const { data } = await api.get(`/admin/questions?${params}`);
      setQuestions(data.questions);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterDiff]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const filtered = questions.filter((q) =>
    !search || q.text?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaved = () => {
    setEditQ(null);
    loadQuestions();
  };

  const handleDeleted = () => {
    setDeleteQ(null);
    loadQuestions();
  };

  return (
    <AdminLayout>
      <div className="px-8 py-8 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Questions</h1>
            <p className="text-sm text-stone-600 mt-1">{total} total questions in the bank</p>
          </div>
          <div className="flex gap-2">
            <button
              id="btn-toggle-bulk"
              onClick={() => setShowBulk((v) => !v)}
              className="px-4 py-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-200 transition-all"
            >
              {showBulk ? 'Hide' : '📥 Bulk Import'}
            </button>
            <button
              id="btn-add-question"
              onClick={() => setEditQ({})}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-900 to-amber-700 text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-amber-900/20"
            >
              + Add Question
            </button>
          </div>
        </div>

        {showBulk && <BulkImportPanel onImported={loadQuestions} />}

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <input
            id="q-search"
            type="text"
            placeholder="Search questions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-900/50 w-64 shadow-sm"
          />
          <select
            id="q-filter-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-900/50 shadow-sm cursor-pointer"
          >
            <option value="">All Types</option>
            {TYPES.map((t) => <option key={t} value={t} className="bg-white">{t}</option>)}
          </select>
          <select
            id="q-filter-diff"
            value={filterDiff}
            onChange={(e) => setFilterDiff(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-900/50 shadow-sm cursor-pointer"
          >
            <option value="">All Difficulties</option>
            {DIFFICULTIES.map((d) => <option key={d} value={d} className="bg-white">{d}</option>)}
          </select>
        </div>

        {error && (
          <div className="glass-card p-4 border border-red-500/20 bg-red-500/5">
            <p className="text-sm text-red-400">⚠ {error}</p>
          </div>
        )}

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs text-stone-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium w-1/2">Question</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Difficulty</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-150">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-stone-150 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-stone-550">
                    No questions found
                  </td>
                </tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q._id} className="hover:bg-stone-100/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-stone-900 line-clamp-2 leading-snug">{q.text}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-stone-600 font-medium">{q.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[q.type] || 'bg-stone-150 text-stone-600'}`}>
                        {q.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${DIFF_COLORS[q.difficulty]}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${q.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-150 text-stone-500'}`}>
                        {q.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          id={`btn-edit-q-${q._id}`}
                          onClick={() => setEditQ(q)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-amber-900 hover:bg-amber-900/10 transition-all"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          id={`btn-delete-q-${q._id}`}
                          onClick={() => setDeleteQ(q)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-red-700 hover:bg-red-500/10 transition-all"
                          title="Deactivate"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modals */}
        {editQ !== null && (
          <QuestionModal
            question={editQ._id ? editQ : null}
            onClose={() => setEditQ(null)}
            onSaved={handleSaved}
          />
        )}
        {deleteQ && (
          <DeleteConfirm
            question={deleteQ}
            onClose={() => setDeleteQ(null)}
            onDeleted={handleDeleted}
          />
        )}
      </div>
    </AdminLayout>
  );
}
