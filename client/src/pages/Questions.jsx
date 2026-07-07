import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

// ─── Axios instance (reuses token from localStorage) ───
const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mockly_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Constants ───
const TYPES = ['all', 'technical', 'behavioral', 'hr', 'aptitude'];
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'];

const DIFFICULTY_COLORS = {
  easy: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  medium: { bg: 'bg-amber-500/15', text: 'text-amber-400', bar: 'bg-amber-500' },
  hard: { bg: 'bg-red-500/15', text: 'text-red-400', bar: 'bg-red-500' },
};

const TYPE_COLORS = {
  technical: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  behavioral: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  hr: { bg: 'bg-teal-500/15', text: 'text-teal-400' },
  aptitude: { bg: 'bg-orange-500/15', text: 'text-orange-400' },
};

// ─── Badge Component ───
function Badge({ label, colorSet }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorSet.bg} ${colorSet.text}`}
    >
      {label}
    </span>
  );
}

// ─── Skeleton Loader ───
function SkeletonCard() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-16 rounded-full bg-white/10" />
        <div className="h-5 w-20 rounded-full bg-white/10" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-white/10 rounded w-full" />
        <div className="h-4 bg-white/10 rounded w-3/4" />
      </div>
    </div>
  );
}

// ─── Question Detail Modal ───
function QuestionModal({ question, onClose }) {
  const navigate = useNavigate();
  if (!question) return null;

  const diffColors = DIFFICULTY_COLORS[question.difficulty] || DIFFICULTY_COLORS.easy;
  const typeColors = TYPE_COLORS[question.type] || TYPE_COLORS.technical;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="glass-card relative w-full max-w-xl p-6 md:p-8 page-enter max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all"
        >
          ✕
        </button>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge label={question.role} colorSet={{ bg: 'bg-indigo-500/15', text: 'text-indigo-400' }} />
          <Badge label={question.type} colorSet={typeColors} />
          <Badge label={question.difficulty} colorSet={diffColors} />
        </div>

        {/* Question text */}
        <h2 className="text-lg font-semibold text-slate-100 leading-relaxed mb-6">
          {question.text}
        </h2>

        {/* MCQ options (aptitude) */}
        {question.type === 'aptitude' && question.options && (
          <div className="space-y-2 mb-6">
            {question.options.map((opt, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10"
              >
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-slate-400">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm text-slate-300">{opt}</span>
              </div>
            ))}
          </div>
        )}

        {/* Practice button */}
        <button
          onClick={() => navigate(`/practice/${question._id}`)}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Practice this Question
        </button>
      </div>
    </div>
  );
}

// ─── Main Questions Page ───
export default function Questions() {
  const [roles, setRoles] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeRole, setActiveRole] = useState('all');
  const [activeType, setActiveType] = useState('all');
  const [activeDifficulty, setActiveDifficulty] = useState('all');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  // Modal
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch roles on mount
  useEffect(() => {
    api
      .get('/roles')
      .then(({ data }) => setRoles(data.roles))
      .catch((err) => console.error('Failed to fetch roles:', err));
  }, []);

  // Fetch questions when filters change
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeRole !== 'all') params.role = activeRole;
      if (activeType !== 'all') params.type = activeType;
      if (activeDifficulty !== 'all') params.difficulty = activeDifficulty;
      if (searchDebounced) params.search = searchDebounced;
      params.page = pagination.page;
      params.limit = 20;

      const { data } = await api.get('/questions', { params });
      setQuestions(data.questions);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoading(false);
    }
  }, [activeRole, activeType, activeDifficulty, searchDebounced, pagination.page]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Reset page when filters change
  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [activeRole, activeType, activeDifficulty, searchDebounced]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background orbs */}
      <div className="bg-orb w-96 h-96 bg-indigo-600 top-[-5%] left-[-5%]" />
      <div className="bg-orb w-72 h-72 bg-violet-600 bottom-[10%] right-[-3%]" style={{ animationDelay: '3s' }} />

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 page-enter">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100">Question Bank</h1>
          <p className="text-slate-400 text-sm mt-1">
            Browse interview questions by role, type, and difficulty
          </p>
        </div>

        {/* Role tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button
            onClick={() => setActiveRole('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              activeRole === 'all'
                ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300 border border-white/10'
            }`}
          >
            All Roles
          </button>
          {roles.map((role) => (
            <button
              key={role._id}
              onClick={() => setActiveRole(role.name)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                activeRole === role.name
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-300 border border-white/10'
              }`}
            >
              {role.displayName}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Type dropdown */}
          <select
            value={activeType}
            onChange={(e) => setActiveType(e.target.value)}
            className="input-field w-auto min-w-[140px] text-sm py-2 px-3 cursor-pointer"
          >
            {TYPES.map((t) => (
              <option key={t} value={t} className="bg-slate-800">
                {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>

          {/* Difficulty dropdown */}
          <select
            value={activeDifficulty}
            onChange={(e) => setActiveDifficulty(e.target.value)}
            className="input-field w-auto min-w-[140px] text-sm py-2 px-3 cursor-pointer"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d} className="bg-slate-800">
                {d === 'all' ? 'All Difficulties' : d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field text-sm py-2 px-3"
            />
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-slate-500 mb-4">
          {loading ? 'Loading…' : `${pagination.total} question${pagination.total !== 1 ? 's' : ''} found`}
        </p>

        {/* Question grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : questions.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              No questions found
            </h3>
            <p className="text-slate-500 text-sm">
              Try adjusting your filters or search term
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {questions.map((q) => {
              const diffColors = DIFFICULTY_COLORS[q.difficulty] || DIFFICULTY_COLORS.easy;
              const typeColors = TYPE_COLORS[q.type] || TYPE_COLORS.technical;

              return (
                <button
                  key={q._id}
                  onClick={() => setSelectedQuestion(q)}
                  className="glass-card p-5 text-left group hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Difficulty accent bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${diffColors.bar} rounded-l-xl`}
                  />

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3 pl-2">
                    <Badge label={q.type} colorSet={typeColors} />
                    <Badge label={q.difficulty} colorSet={diffColors} />
                    {q.type === 'aptitude' && (
                      <Badge
                        label="MCQ"
                        colorSet={{ bg: 'bg-orange-500/15', text: 'text-orange-400' }}
                      />
                    )}
                  </div>

                  {/* Question text (truncated) */}
                  <p className="text-sm text-slate-300 leading-relaxed pl-2 line-clamp-3 group-hover:text-slate-200 transition-colors">
                    {q.text}
                  </p>

                  {/* Role chip */}
                  <div className="mt-3 pl-2">
                    <span className="text-xs text-slate-500 font-medium">
                      {q.role}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-sm border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>
            <span className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-sm border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* Detail modal */}
      <QuestionModal
        question={selectedQuestion}
        onClose={() => setSelectedQuestion(null)}
      />
    </div>
  );
}
