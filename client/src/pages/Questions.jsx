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
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-all"
        >
          ✕
        </button>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge label={question.role} colorSet={{ bg: 'bg-amber-100', text: 'text-amber-800' }} />
          <Badge label={question.type} colorSet={typeColors} />
          <Badge label={question.difficulty} colorSet={diffColors} />
        </div>

        {/* Question text */}
        <h2 className="text-lg font-semibold text-stone-900 leading-relaxed mb-6">
          {question.text}
        </h2>

        {/* MCQ options (aptitude) */}
        {question.type === 'aptitude' && question.options && (
          <div className="space-y-2 mb-6">
            {question.options.map((opt, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-stone-100 border border-stone-200"
              >
                <span className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium text-stone-700">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm text-stone-700">{opt}</span>
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
  const navigate = useNavigate();
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

<<<<<<< HEAD
=======
  // Mock interview state
  const [showMockModal, setShowMockModal] = useState(false);
  const [mockRole, setMockRole] = useState('');
  const [startingMock, setStartingMock] = useState(false);
  const [activeSessionPrompt, setActiveSessionPrompt] = useState(null);

  const startMockInterview = async (forceFresh = false) => {
    const roleToUse = mockRole || (activeSessionPrompt ? activeSessionPrompt.role : (roles.length > 0 ? roles[0].name : 'SDE'));
    setStartingMock(true);
    try {
      const { data } = await api.post('/sessions/start', {
        role: roleToUse,
        forceFresh,
      });

      if (data.activeSessionExists && !forceFresh) {
        setActiveSessionPrompt(data.session);
        setShowMockModal(false);
        setStartingMock(false);
        return;
      }

      setActiveSessionPrompt(null);
      setShowMockModal(false);
      setStartingMock(false);
      if (data.session && data.session._id) {
        navigate(`/mock/${data.session._id}`);
      }
    } catch (err) {
      console.error('Failed to start mock:', err);
      alert(err.response?.data?.message || 'Error starting mock interview session');
      setStartingMock(false);
    }
  };

>>>>>>> 4edffb255a90bf7d4f3060cb321980855f750d39
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
    <div className="min-h-screen relative">
      {/* Background orbs */}


      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 page-enter">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Practice Questions</h1>
          <p className="text-stone-500 text-sm mt-1">
            Browse interview questions by role, type, and difficulty
          </p>
        </div>

        {/* Role tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button
            onClick={() => setActiveRole('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              activeRole === 'all'
                ? 'bg-gradient-to-r from-amber-900 to-amber-700 text-white shadow-lg shadow-amber-900/25'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800 border border-stone-300'
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
                  ? 'bg-gradient-to-r from-amber-900 to-amber-700 text-white shadow-lg shadow-amber-900/25'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800 border border-stone-300'
              }`}
            >
              {role.displayName}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 items-stretch md:items-center">
          {/* Side-by-side Dropdowns */}
          <div className="flex gap-2 shrink-0">
            {/* Type dropdown */}
            <select
              value={activeType}
              onChange={(e) => setActiveType(e.target.value)}
              className="bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl text-stone-700 text-sm py-2 px-3.5 focus:outline-none focus:ring-1 focus:ring-amber-900/40 cursor-pointer shadow-sm min-w-[140px] transition-all"
            >
              {TYPES.map((t) => (
                <option key={t} value={t} className="bg-white text-stone-700">
                  {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>

            {/* Difficulty dropdown */}
            <select
              value={activeDifficulty}
              onChange={(e) => setActiveDifficulty(e.target.value)}
              className="bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl text-stone-700 text-sm py-2 px-3.5 focus:outline-none focus:ring-1 focus:ring-amber-900/40 cursor-pointer shadow-sm min-w-[140px] transition-all"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d} className="bg-white text-stone-700">
                  {d === 'all' ? 'All Difficulties' : d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field text-sm py-2 px-3 w-full"
            />
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-stone-500 mb-4">
          {loading ? 'Loading…' : `${pagination.total} question${pagination.total !== 1 ? 's' : ''} found`}
        </p>

        {/* Question grid */}
        <div className="min-h-[500px]">
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
              <h3 className="text-lg font-semibold text-stone-600 mb-2">
                No questions found
              </h3>
              <p className="text-stone-500 text-sm">
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
                    <p className="text-sm text-stone-700 leading-relaxed pl-2 line-clamp-3 group-hover:text-stone-900 transition-colors">
                      {q.text}
                    </p>

                    {/* Role chip */}
                    <div className="mt-3 pl-2">
                      <span className="text-xs text-stone-500 font-medium">
                        {q.role}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>


        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 text-sm border border-stone-200 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>
            <span className="text-sm text-stone-500">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 text-sm border border-stone-200 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
<<<<<<< HEAD
=======

      {/* Mock Interview Modal */}
      {showMockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowMockModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="glass-card relative w-full max-w-md p-6 md:p-8 page-enter" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMockModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-850 transition-all"
            >
              ✕
            </button>

            <h2 className="text-lg font-bold text-stone-900 mb-2">Start Mock Interview</h2>
            <p className="text-sm text-stone-500 mb-6">
              10 balanced questions • 45-minute timer • AI-graded scorecard
            </p>

            <label className="block text-sm font-medium text-stone-700 mb-2">Select Target Role</label>
            <select
              value={mockRole}
              onChange={(e) => setMockRole(e.target.value)}
              className="input-field w-full text-sm py-2.5 px-3 cursor-pointer mb-6 animate-none"
            >
              <option value="" className="bg-white text-stone-700">Choose a role...</option>
              {roles.map((role) => (
                <option key={role._id} value={role.name} className="bg-white text-stone-700">
                  {role.displayName}
                </option>
              ))}
            </select>

            <button
              onClick={() => startMockInterview(false)}
              disabled={startingMock}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {startingMock ? (
                <>
                  <div className="spinner" style={{ width: '1rem', height: '1rem' }} />
                  Starting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Begin Interview
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Option B: Active Session Resume vs Start Fresh Modal */}
      {activeSessionPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setActiveSessionPrompt(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="glass-card relative w-full max-w-md p-6 md:p-8 page-enter" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveSessionPrompt(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-all"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center text-2xl mb-4 font-bold">
              ⏱
            </div>

            <h2 className="text-lg font-bold text-stone-900 mb-2">Active Session Found</h2>
            <p className="text-sm text-stone-600 mb-6">
              You already have an active <strong>{activeSessionPrompt.role}</strong> mock interview session in progress. Would you like to resume it or start a fresh session?
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  const sessId = activeSessionPrompt._id;
                  setActiveSessionPrompt(null);
                  navigate(`/mock/${sessId}`);
                }}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                🔄 Resume Active Interview
              </button>

              <button
                onClick={() => startMockInterview(true)}
                disabled={startingMock}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 text-stone-700 font-semibold hover:bg-stone-100 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {startingMock ? 'Starting Fresh...' : '🗑️ Cancel & Start Fresh Interview'}
              </button>
            </div>
          </div>
        </div>
      )}
>>>>>>> 4edffb255a90bf7d4f3060cb321980855f750d39
    </div>
  );
}
