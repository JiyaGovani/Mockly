import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mockly_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const DIFFICULTY_COLORS = {
  easy: 'text-emerald-400 bg-emerald-500/15',
  medium: 'text-amber-400 bg-amber-500/15',
  hard: 'text-red-400 bg-red-500/15',
};

const TYPE_COLORS = {
  technical: 'text-blue-400 bg-blue-500/15',
  behavioral: 'text-purple-400 bg-purple-500/15',
  hr: 'text-teal-400 bg-teal-500/15',
  aptitude: 'text-orange-400 bg-orange-500/15',
};

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function MockInterview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [remaining, setRemaining] = useState(45 * 60);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);
  const textareaRef = useRef(null);

  // Focus textarea when current index changes
  useEffect(() => {
    if (!loading && !submitting && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentIdx, loading, submitting]);

  // Prevent accidental tab close/refresh
  useEffect(() => {
    if (loading || submitting) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your active mock interview progress is saved, but the timer will continue running.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [loading, submitting]);

  // Fetch session on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/sessions/${id}`);
        if (!data.session) {
          navigate('/questions');
          return;
        }
        const sess = data.session;
        setSession(sess);

        // Restore answers from session
        const restored = {};
        sess.answers.forEach((a) => {
          restored[a.question._id || a.question] = a.userAnswer || '';
        });
        setAnswers(restored);

        // Calculate remaining time from startedAt
        const elapsed = Math.floor((Date.now() - new Date(sess.startedAt).getTime()) / 1000);
        const duration = (sess.durationMinutes || 45) * 60;
        const rem = Math.max(0, duration - elapsed);
        setRemaining(rem);

        // If completed, abandoned, or cancelled, redirect accordingly
        if (sess.status === 'completed') {
          navigate(`/mock/scorecard/${sess._id}`);
          return;
        }
        if (sess.status === 'abandoned' || sess.status === 'cancelled') {
          navigate('/questions');
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load session:', err);
        navigate('/questions');
      }
    })();
  }, [id, navigate]);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancelSession = async () => {
    if (!session) return;
    setCancelling(true);
    try {
      await api.post(`/sessions/${session._id}/cancel`);
      navigate('/questions');
    } catch (err) {
      console.error('Failed to cancel session:', err);
      setCancelling(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (loading || submitting) return;

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, submitting]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (loading || submitting) return;

    autoSaveRef.current = setInterval(() => {
      saveAnswers();
    }, 30000);

    return () => clearInterval(autoSaveRef.current);
  }, [loading, submitting, answers]);

  const saveAnswers = useCallback(async () => {
    if (!session) return;
    setSaving(true);
    try {
      const payload = Object.entries(answers).map(([questionId, userAnswer]) => ({
        questionId,
        userAnswer,
      }));
      await api.put(`/sessions/${session._id}/save`, { answers: payload });
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [session, answers]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    clearInterval(autoSaveRef.current);

    try {
      // Save latest answers first
      const payload = Object.entries(answers).map(([questionId, userAnswer]) => ({
        questionId,
        userAnswer,
      }));
      await api.put(`/sessions/${session._id}/save`, { answers: payload });

      // Submit for evaluation depending on context
      if (state?.isUnlock && state?.placementRole && state?.placementRound) {
        // Unlock session submit
        const { data } = await api.post('/placement/unlock/submit', {
          role: state.placementRole,
          roundKey: state.placementRound,
          sessionId: session._id,
        });
        // Navigate to scorecard then pass unlock result in state
        navigate(`/mock/scorecard/${session._id}`, {
          state: {
            ...state,
            unlockResult: data,
          },
        });
      } else if (state?.placementRound && state?.placementRole) {
        if (state.placementRound === 'technical') {
          await api.post('/placement/technical/submit', { role: state.placementRole });
        } else if (state.placementRound === 'hr') {
          await api.post('/placement/hr/submit', { role: state.placementRole });
        }
        navigate(`/mock/scorecard/${session._id}`, { state });
      } else {
        await api.post(`/sessions/${session._id}/submit`);
        navigate(`/mock/scorecard/${session._id}`, { state });
      }
    } catch (err) {
      console.error('Submit failed:', err);
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (text) => {
    const qId = session.questions[currentIdx]._id;
    setAnswers((prev) => ({ ...prev, [qId]: text }));
  };

  const goToQuestion = async (idx) => {
    // Save before switching
    await saveAnswers();
    setCurrentIdx(idx);
  };

  if (loading) {
    return (
      <div className="min-h-screen relative">

        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="spinner mx-auto mb-4" style={{ width: '3rem', height: '3rem' }} />
            <p className="text-stone-500">Loading interview session...</p>
          </div>
        </div>
      </div>
    );
  }

  // Submitting overlay
  if (submitting) {
    return (
      <div className="min-h-screen relative">

        <Navbar />
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card p-10 text-center max-w-md">
            <div className="spinner mx-auto mb-6" style={{ width: '3rem', height: '3rem' }} />
            <h2 className="text-xl font-bold text-stone-800 mb-2">Evaluating Your Answers</h2>
            <p className="text-stone-500 text-sm">
              AI is analyzing your responses. This may take a moment as each answer is evaluated
              for keywords, semantic similarity, and LLM scoring...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[currentIdx];
  const isWarning = remaining <= 300; // 5 minutes
  const answeredCount = session.questions.filter(
    (q) => answers[q._id] && answers[q._id].trim() !== ''
  ).length;

  return (
    <div className="min-h-screen relative">
      {/* Background */}


      <Navbar />

      <div className="flex h-[calc(100vh-64px)]">
        {/* ─── LEFT SIDEBAR ─── */}
        <aside className="w-64 flex-shrink-0 border-r border-white/10 bg-white/[0.02] backdrop-blur-sm flex flex-col">
          {/* Session title */}
          <div className="p-4 border-b border-stone-200">
            <h2 className="text-sm font-bold text-stone-900 tracking-wide uppercase">
              Mock Interview
            </h2>
            <p className="text-xs text-stone-650 mt-1">{session.role} • {session.questions.length} Questions</p>
          </div>

          {/* Question tabs */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {session.questions.map((q, idx) => {
              const isActive = idx === currentIdx;
              const isAnswered = answers[q._id] && answers[q._id].trim() !== '';

              return (
                <button
                  key={q._id}
                  onClick={() => goToQuestion(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-900/10 border border-amber-900/20 text-stone-900 font-semibold'
                      : 'hover:bg-stone-100 text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {/* Status dot */}
                  <span
                    className={`w-3 h-3 rounded-full flex-shrink-0 transition-all ${
                      isActive
                        ? 'bg-amber-900 shadow-lg shadow-amber-900/50'
                        : isAnswered
                        ? 'bg-emerald-500'
                        : 'border-2 border-stone-400'
                    }`}
                  />
                  <span className="truncate">Q{idx + 1}</span>
                  <span
                    className={`text-xs ml-auto ${
                      isActive ? 'text-amber-900 font-semibold' : 'text-stone-500'
                    }`}
                  >
                    {q.type && q.type.charAt(0).toUpperCase() + q.type.slice(1, 4)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Timer */}
          <div className={`p-4 border-t border-stone-200 text-center ${
            isWarning ? 'animate-pulse' : ''
          }`}>
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Time Remaining</p>
            <p className={`text-3xl font-mono font-bold tracking-wider ${
              isWarning ? 'text-red-650' : 'text-stone-900'
            }`}>
              {formatTime(remaining)}
            </p>
            <p className="text-xs text-stone-550 mt-2 mb-3">
              {answeredCount}/{session.questions.length} answered
            </p>
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full px-3 py-2 rounded-lg bg-stone-100 border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all flex items-center justify-center gap-1.5"
            >
              <span>🚪</span> Exit / Cancel Interview
            </button>
          </div>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Question card */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="glass-card p-6 md:p-8 max-w-4xl mx-auto">
              {/* Header badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm font-semibold text-stone-600">
                  Question {currentIdx + 1} of {session.questions.length}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  TYPE_COLORS[currentQuestion.type] || TYPE_COLORS.technical
                }`}>
                  {currentQuestion.type}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  DIFFICULTY_COLORS[currentQuestion.difficulty] || DIFFICULTY_COLORS.easy
                }`}>
                  {currentQuestion.difficulty}
                </span>
              </div>

              {/* Question text */}
              <h3 className="text-lg md:text-xl font-semibold text-stone-900 leading-relaxed mb-6">
                {currentQuestion.text}
              </h3>

              {/* MCQ Options Selector vs Answer textarea */}
              {Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {currentQuestion.options.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const currentAns = (answers[currentQuestion._id] || '').trim();
                    const isSelected = currentAns.toLowerCase() === opt.toLowerCase() ||
                                       currentAns.toUpperCase() === letter ||
                                       currentAns === String(i);

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAnswerChange(opt)}
                        className={`flex items-center gap-3 p-4 rounded-xl text-left border transition-all ${
                          isSelected
                            ? 'bg-amber-900/10 border-amber-900 text-stone-900 shadow-lg shadow-amber-900/10 ring-1 ring-amber-900 font-semibold'
                            : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                          isSelected ? 'bg-amber-900 text-white' : 'bg-stone-200 text-stone-600'
                        }`}>
                          {letter}
                        </span>
                        <span className="text-sm font-medium flex-1 leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={answers[currentQuestion._id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={10}
                  className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-850 placeholder-stone-400 focus:outline-none focus:border-amber-900/50 focus:ring-1 focus:ring-amber-900/25 resize-none text-sm leading-relaxed transition-all shadow-sm"
                />
              )}
            </div>
          </div>

          {/* Action bar */}
          <div className="border-t border-stone-200 bg-white/60 backdrop-blur-sm px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              {/* Previous */}
              <button
                onClick={() => goToQuestion(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2.5 rounded-lg bg-stone-100 text-stone-600 text-sm border border-stone-200 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ← Previous
              </button>

              {/* Save indicator */}
              <div className="flex items-center gap-3">
                {saving && (
                  <span className="text-xs text-amber-900 animate-pulse">Saving...</span>
                )}
                <button
                  onClick={saveAnswers}
                  className="px-4 py-2.5 rounded-lg bg-stone-100 text-stone-600 text-sm border border-stone-200 hover:bg-stone-200 transition-all"
                >
                  Save Progress
                </button>
              </div>

              {/* Next or Submit */}
              {currentIdx < session.questions.length - 1 ? (
                <button
                  onClick={() => goToQuestion(currentIdx + 1)}
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-900 to-amber-700 text-white text-sm font-medium shadow-lg shadow-amber-900/25 hover:shadow-amber-900/40 transition-all"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
                >
                  Submit Session
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCancelModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="glass-card relative w-full max-w-md p-6 md:p-8 page-enter" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-all"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-600 flex items-center justify-center text-2xl mb-4 font-bold">
              ⚠️
            </div>

            <h2 className="text-lg font-bold text-stone-900 mb-2">Cancel Mock Interview?</h2>
            <p className="text-sm text-stone-600 mb-6">
              Are you sure you want to exit and cancel this session? Your interview progress for this round will be discarded.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold hover:bg-stone-100 transition-all text-sm"
              >
                Continue Interview
              </button>
              <button
                onClick={handleCancelSession}
                disabled={cancelling}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all text-sm disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
