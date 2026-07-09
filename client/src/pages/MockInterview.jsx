import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

        // If already completed, redirect to scorecard
        if (sess.status === 'completed') {
          navigate(`/mock/scorecard/${sess._id}`);
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load session:', err);
        navigate('/questions');
      }
    })();
  }, [id, navigate]);

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

      // Submit for evaluation
      await api.post(`/sessions/${session._id}/submit`);
      navigate(`/mock/scorecard/${session._id}`);
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
      <div className="min-h-screen relative overflow-hidden">
        <div className="bg-orb w-96 h-96 bg-indigo-600 top-[-5%] left-[-5%]" />
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="spinner mx-auto mb-4" style={{ width: '3rem', height: '3rem' }} />
            <p className="text-slate-400">Loading interview session...</p>
          </div>
        </div>
      </div>
    );
  }

  // Submitting overlay
  if (submitting) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="bg-orb w-96 h-96 bg-indigo-600 top-[-5%] left-[-5%]" />
        <Navbar />
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card p-10 text-center max-w-md">
            <div className="spinner mx-auto mb-6" style={{ width: '3rem', height: '3rem' }} />
            <h2 className="text-xl font-bold text-slate-100 mb-2">Evaluating Your Answers</h2>
            <p className="text-slate-400 text-sm">
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="bg-orb w-96 h-96 bg-indigo-600 top-[-5%] left-[-5%]" />
      <div className="bg-orb w-72 h-72 bg-violet-600 bottom-[10%] right-[-3%]" style={{ animationDelay: '3s' }} />

      <Navbar />

      <div className="flex h-[calc(100vh-64px)]">
        {/* ─── LEFT SIDEBAR ─── */}
        <aside className="w-64 flex-shrink-0 border-r border-white/10 bg-white/[0.02] backdrop-blur-sm flex flex-col">
          {/* Session title */}
          <div className="p-4 border-b border-white/10">
            <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase">
              Mock Interview
            </h2>
            <p className="text-xs text-slate-500 mt-1">{session.role} • {session.questions.length} Questions</p>
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
                      ? 'bg-indigo-500/20 border border-indigo-500/40 text-slate-100'
                      : 'hover:bg-white/5 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {/* Status dot */}
                  <span
                    className={`w-3 h-3 rounded-full flex-shrink-0 transition-all ${
                      isActive
                        ? 'bg-indigo-500 shadow-lg shadow-indigo-500/50'
                        : isAnswered
                        ? 'bg-emerald-500'
                        : 'border-2 border-slate-600'
                    }`}
                  />
                  <span className="truncate">Q{idx + 1}</span>
                  <span
                    className={`text-xs ml-auto ${
                      isActive ? 'text-indigo-300' : 'text-slate-600'
                    }`}
                  >
                    {q.type && q.type.charAt(0).toUpperCase() + q.type.slice(1, 4)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Timer */}
          <div className={`p-4 border-t border-white/10 text-center ${
            isWarning ? 'animate-pulse' : ''
          }`}>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Time Remaining</p>
            <p className={`text-3xl font-mono font-bold tracking-wider ${
              isWarning ? 'text-red-400' : 'text-slate-200'
            }`}>
              {formatTime(remaining)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {answeredCount}/{session.questions.length} answered
            </p>
          </div>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Question card */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="glass-card p-6 md:p-8 max-w-4xl mx-auto">
              {/* Header badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm font-semibold text-slate-300">
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
              <h3 className="text-lg md:text-xl font-semibold text-slate-100 leading-relaxed mb-6">
                {currentQuestion.text}
              </h3>

              {/* Answer textarea */}
              <textarea
                ref={textareaRef}
                value={answers[currentQuestion._id] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type your answer here..."
                rows={10}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 resize-none text-sm leading-relaxed transition-all"
              />
            </div>
          </div>

          {/* Action bar */}
          <div className="border-t border-white/10 bg-white/[0.02] backdrop-blur-sm px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              {/* Previous */}
              <button
                onClick={() => goToQuestion(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2.5 rounded-lg bg-white/5 text-slate-400 text-sm border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ← Previous
              </button>

              {/* Save indicator */}
              <div className="flex items-center gap-3">
                {saving && (
                  <span className="text-xs text-indigo-400 animate-pulse">Saving...</span>
                )}
                <button
                  onClick={saveAnswers}
                  className="px-4 py-2.5 rounded-lg bg-white/5 text-slate-300 text-sm border border-white/10 hover:bg-white/10 transition-all"
                >
                  Save Progress
                </button>
              </div>

              {/* Next or Submit */}
              {currentIdx < session.questions.length - 1 ? (
                <button
                  onClick={() => goToQuestion(currentIdx + 1)}
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
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
    </div>
  );
}
