import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

// ─── Axios instance ───
const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mockly_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Timer Display ───
function Timer({ seconds }) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  const isWarning = seconds <= 60;
  return (
    <div
      className={`font-mono text-lg font-bold tabular-nums ${
        isWarning ? 'text-red-400 animate-pulse' : 'text-slate-200'
      }`}
    >
      {m}:{s}
    </div>
  );
}

// ─── Main Page ───
export default function AptitudeWorkspace() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const { role, questions: initialQuestions = [], attempt: initialAttempt } = state || {};

  const [questions, setQuestions] = useState(initialQuestions);
  const [currentIdx, setCurrentIdx] = useState(0);
  // answers: { [questionId]: selectedOptionIndex }
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 min for aptitude
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Guard: if navigated directly without state, go back to hub
  useEffect(() => {
    if (!role || questions.length === 0) {
      navigate('/placement', { replace: true });
    }
  }, [role, questions, navigate]);

  // Countdown timer
  useEffect(() => {
    if (submitted) return;
    if (timeLeft <= 0) {
      handleSubmit(true); // auto-submit on timeout
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, submitted]);

  const handleSelect = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = useCallback(
    async (isAutoSubmit = false) => {
      if (submitting || submitted) return;
      setSubmitting(true);
      setError(null);

      const answersPayload = questions.map((q) => ({
        questionId: q._id,
        selectedOption: answers[q._id] ?? null,
      }));

      try {
        const { data } = await api.post('/placement/aptitude/submit', {
          role,
          answers: answersPayload,
        });
        setResult(data);
        setSubmitted(true);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to submit aptitude round');
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, submitted, questions, answers, role]
  );

  if (!role || questions.length === 0) return null;

  const q = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  // ─── Result Screen ───
  if (submitted && result) {
    const { score, passed, correctCount, totalQuestions, attemptsUsed, attemptsRemaining, locked } = result;

    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
          {/* Score card */}
          <div
            className={`glass-card p-8 text-center space-y-6 ring-1 ${
              passed ? 'ring-emerald-500/30 shadow-emerald-500/10' : 'ring-red-500/20 shadow-red-500/10'
            } shadow-lg`}
          >
            <div className="text-5xl">{passed ? '🎉' : '😔'}</div>
            <h1 className="text-2xl font-bold text-white">
              Aptitude Round {passed ? 'Passed!' : 'Failed'}
            </h1>

            {/* Score circle */}
            <div className="flex justify-center">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={passed ? '#10b981' : '#ef4444'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * 264} 264`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white">{score}</span>
                  <span className="text-xs text-slate-400">/ 100</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xl font-bold text-white">{correctCount}</div>
                <div className="text-xs text-slate-400">Correct</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xl font-bold text-white">{totalQuestions - correctCount}</div>
                <div className="text-xs text-slate-400">Wrong</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xl font-bold text-white">{totalQuestions}</div>
                <div className="text-xs text-slate-400">Total</div>
              </div>
            </div>

            {!passed && !locked && (
              <p className="text-sm text-slate-400">
                {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining (Used {attemptsUsed}/{3})
              </p>
            )}
            {locked && (
              <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                <p className="text-sm text-red-400 font-medium">
                  🔒 Round locked — maximum attempts reached.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              id="btn-back-to-placement"
              onClick={() => navigate('/placement')}
              className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all"
            >
              ← Back to Placement Hub
            </button>
            {passed && (
              <button
                id="btn-next-round"
                onClick={() => navigate('/placement')}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition-all"
              >
                Continue to Technical →
              </button>
            )}
            {!passed && !locked && (
              <button
                id="btn-retry-aptitude"
                onClick={() => navigate('/placement')}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold hover:opacity-90 transition-all"
              >
                Retry Round
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Active Test Workspace ───
  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 flex gap-6">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 space-y-4">
          {/* Timer */}
          <div className="glass-card p-4 flex flex-col items-center gap-1">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Time Left</span>
            <Timer seconds={timeLeft} />
          </div>

          {/* Progress */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Progress</span>
              <span>{answeredCount}/{questions.length}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question grid nav */}
          <div className="glass-card p-4 space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Questions</p>
            <div className="grid grid-cols-4 gap-1.5">
              {questions.map((q, idx) => (
                <button
                  key={q._id}
                  id={`q-nav-${idx + 1}`}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                    currentIdx === idx
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                      : answers[q._id] !== undefined
                      ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            id="btn-submit-aptitude"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-wait"
          >
            {submitting ? 'Submitting…' : 'Submit Test'}
          </button>
        </aside>

        {/* Main question area */}
        <main className="flex-1 space-y-5">
          {/* Question header */}
          <div className="glass-card p-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400">
                Aptitude — {role}
              </span>
            </div>
            <p className="text-white font-medium text-lg leading-relaxed mt-2">{q.text}</p>
          </div>

          {/* MCQ Options */}
          <div className="space-y-3">
            {(q.options || []).map((option, optIdx) => {
              const isSelected = answers[q._id] === optIdx;
              return (
                <button
                  key={optIdx}
                  id={`q${currentIdx + 1}-opt-${optIdx}`}
                  onClick={() => handleSelect(q._id, optIdx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? 'border-orange-500/50 bg-orange-500/10 text-white shadow-md shadow-orange-500/10'
                      : 'border-white/5 bg-white/3 text-slate-300 hover:border-white/15 hover:bg-white/8'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                        isSelected
                          ? 'border-orange-400 bg-orange-500 text-white'
                          : 'border-white/20 text-slate-500'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              id="btn-prev-q"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => i - 1)}
              className="px-5 py-2 rounded-xl text-sm text-slate-400 bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all"
            >
              ← Previous
            </button>
            <span className="text-xs text-slate-500">
              {answeredCount} of {questions.length} answered
            </span>
            <button
              id="btn-next-q"
              disabled={currentIdx === questions.length - 1}
              onClick={() => setCurrentIdx((i) => i + 1)}
              className="px-5 py-2 rounded-xl text-sm text-slate-400 bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all"
            >
              Next →
            </button>
          </div>

          {error && (
            <div className="glass-card p-4 border border-red-500/20 bg-red-500/5">
              <p className="text-sm text-red-400">⚠ {error}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
