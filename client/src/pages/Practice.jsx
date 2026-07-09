import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

// ─── Axios instance ───
const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mockly_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Constants ───
const DIFFICULTY_COLORS = {
  easy: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  medium: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  hard: { bg: 'bg-red-500/15', text: 'text-red-400' },
};

const TYPE_COLORS = {
  technical: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  behavioral: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  hr: { bg: 'bg-teal-500/15', text: 'text-teal-400' },
  aptitude: { bg: 'bg-orange-500/15', text: 'text-orange-400' },
};

const TIPS = [
  '💡 Tip: Structure your answer with a clear definition first, then examples.',
  '🎯 Focus on key terms that the interviewer is looking for.',
  '⏱ In a real interview, aim for 2-3 minute responses.',
  '📝 Use the STAR method for behavioral questions (Situation, Task, Action, Result).',
  '🧠 Think out loud — interviewers value your thought process.',
  '✅ Cover edge cases and trade-offs to stand out.',
  '🔄 Compare and contrast when explaining similar concepts.',
  '📊 Back up your points with real-world examples when possible.',
];

const PROCESSING_STEPS = [
  { label: 'Analyzing keywords in your answer', icon: '🔍' },
  { label: 'Computing semantic similarity', icon: '🧮' },
  { label: 'Running AI evaluation model', icon: '🤖' },
  { label: 'Generating detailed feedback', icon: '📝' },
];

// ─── Score Ring Component ───
function ScoreRing({ score, size = 120, stroke = 8, label }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s) => {
    if (s >= 80) return '#22c55e';
    if (s >= 60) return '#eab308';
    if (s >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor(score)}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-100">{score}</span>
        </div>
      </div>
      {label && <span className="text-xs text-slate-400 font-medium">{label}</span>}
    </div>
  );
}

// ─── Metric Bar ───
function MetricBar({ label, value, icon }) {
  const getBarColor = (v) => {
    if (v >= 80) return 'bg-emerald-500';
    if (v >= 60) return 'bg-amber-500';
    if (v >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400 flex items-center gap-1.5">
          <span>{icon}</span> {label}
        </span>
        <span className="text-slate-200 font-semibold">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full ${getBarColor(value)} transition-all duration-1000 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─── Feedback Card ───
function FeedbackCard({ title, items, icon, colorClass }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="glass-card p-4">
      <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${colorClass}`}>
        <span>{icon}</span> {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
            <span className="text-slate-500 mt-0.5 shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Loading Card ───
function LoadingCard({ currentStep }) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-6 md:p-8 page-enter">
      <div className="flex items-center gap-3 mb-6">
        <div className="spinner" style={{ width: '1.5rem', height: '1.5rem' }} />
        <h3 className="text-lg font-semibold text-slate-100">Evaluating your answer...</h3>
      </div>

      {/* Processing Steps */}
      <div className="space-y-3 mb-8">
        {PROCESSING_STEPS.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
              i < currentStep
                ? 'bg-emerald-500/10 border border-emerald-500/20'
                : i === currentStep
                ? 'bg-indigo-500/10 border border-indigo-500/30 animate-pulse'
                : 'bg-white/5 border border-white/10 opacity-40'
            }`}
          >
            <span className="text-lg">{i < currentStep ? '✅' : step.icon}</span>
            <span className={`text-sm ${i <= currentStep ? 'text-slate-200' : 'text-slate-500'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Rotating Tips */}
      <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20">
        <p className="text-sm text-indigo-300 transition-all duration-500" key={tipIndex}>
          {TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
}

// ─── Main Practice Page ───
export default function Practice() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userAnswer, setUserAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Fetch the question details
  useEffect(() => {
    api
      .get(`/questions/${id}`)
      .then(({ data }) => {
        setQuestion(data.question || data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch question:', err);
        setError('Question not found');
        setLoading(false);
      });
  }, [id]);

  // Simulate step progression during loading
  useEffect(() => {
    if (!submitting) return;
    const timers = [
      setTimeout(() => setLoadingStep(1), 2000),
      setTimeout(() => setLoadingStep(2), 4000),
      setTimeout(() => setLoadingStep(3), 8000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [submitting]);

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;

    setSubmitting(true);
    setLoadingStep(0);
    setError('');

    try {
      const { data } = await api.post('/evaluation/submit', {
        questionId: id,
        userAnswer: userAnswer.trim(),
      });
      setResult(data);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Evaluation failed';

      if (status === 503) {
        setError("⚠️ Local Ollama service is offline. Please start it using 'ollama serve'.");
      } else if (status === 404) {
        setError("⚠️ AI model not found. Please run 'ollama pull' for required models.");
      } else if (status === 504) {
        setError('⏱ Evaluation timed out. Your machine may be under heavy load — please try again.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setUserAnswer('');
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 pt-24">
          <div className="glass-card p-8 animate-pulse">
            <div className="h-5 w-24 rounded-full bg-white/10 mb-4" />
            <div className="h-6 bg-white/10 rounded w-full mb-2" />
            <div className="h-6 bg-white/10 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !question) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 pt-24 text-center">
          <div className="glass-card p-8">
            <p className="text-red-400 text-lg">{error}</p>
            <button
              onClick={() => navigate('/questions')}
              className="btn-primary mt-4"
            >
              ← Back to Questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const diffColors = DIFFICULTY_COLORS[question?.difficulty] || DIFFICULTY_COLORS.easy;
  const typeColors = TYPE_COLORS[question?.type] || TYPE_COLORS.technical;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16 page-enter">

        {/* Back Button */}
        <button
          onClick={() => navigate('/questions')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Questions
        </button>

        {/* Question Card */}
        <div className="glass-card p-6 md:p-8 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-400`}>
              {question.role}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors.bg} ${typeColors.text}`}>
              {question.type}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${diffColors.bg} ${diffColors.text}`}>
              {question.difficulty}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 leading-relaxed">
            {question.text}
          </h1>
        </div>

        {/* ─── Answer Area or Loading or Results ─── */}

        {submitting ? (
          <LoadingCard currentStep={loadingStep} />
        ) : result ? (
          /* ─── Results Scorecard ─── */
          <div className="space-y-6 page-enter">

            {/* Overall Score + Metrics Row */}
            <div className="glass-card p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Score Ring */}
                <ScoreRing score={result.overallScore} size={140} stroke={10} label="Overall Score" />

                {/* Metrics */}
                <div className="flex-1 w-full space-y-4">
                  <MetricBar label="Keyword Coverage" value={result.keywordScore} icon="🔑" />
                  <MetricBar
                    label="Semantic Similarity"
                    value={Math.round((result.semanticSimilarity || 0) * 100)}
                    icon="🧬"
                  />
                  <MetricBar label="AI Evaluation" value={result.llmScore} icon="🤖" />
                </div>
              </div>

              {/* Latency Stats */}
              {result.latency && (
                <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>⚡ Embedding: {result.latency.embedding}ms</span>
                  <span>🧠 LLM: {(result.latency.llm / 1000).toFixed(1)}s</span>
                  <span>⏱ Total: {(result.latency.total / 1000).toFixed(1)}s</span>
                </div>
              )}
            </div>

            {/* Keywords */}
            {(result.matchedKeywords?.length > 0 || result.missingKeywords?.length > 0) && (
              <div className="glass-card p-5">
                <h4 className="text-sm font-semibold text-slate-300 mb-3">🔑 Keyword Analysis</h4>
                <div className="flex flex-wrap gap-2">
                  {result.matchedKeywords?.map((kw, i) => (
                    <span
                      key={`m-${i}`}
                      className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/15 text-emerald-400 font-medium"
                    >
                      ✓ {kw}
                    </span>
                  ))}
                  {result.missingKeywords?.map((kw, i) => (
                    <span
                      key={`x-${i}`}
                      className="px-2.5 py-1 text-xs rounded-full bg-red-500/15 text-red-400 font-medium"
                    >
                      ✗ {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeedbackCard
                title="Strengths"
                items={result.strengths}
                icon="💪"
                colorClass="text-emerald-400"
              />
              <FeedbackCard
                title="Weaknesses"
                items={result.weaknesses}
                icon="⚠️"
                colorClass="text-amber-400"
              />
              <FeedbackCard
                title="Missing Points"
                items={result.missingPoints}
                icon="❌"
                colorClass="text-red-400"
              />
              <FeedbackCard
                title="Suggestions"
                items={result.suggestions}
                icon="💡"
                colorClass="text-indigo-400"
              />
            </div>

            {/* Try Again */}
            <div className="flex gap-3">
              <button onClick={handleReset} className="btn-primary flex-1">
                🔄 Try Again
              </button>
              <button
                onClick={() => navigate('/questions')}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all font-medium"
              >
                ← Back to Questions
              </button>
            </div>
          </div>
        ) : (
          /* ─── Answer Input ─── */
          <div className="glass-card p-6 md:p-8">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Your Answer
            </label>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer here... Be thorough and include key concepts."
              rows={10}
              className="input-field resize-y min-h-[200px] text-sm leading-relaxed"
            />

            {/* Word count */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-500">
                {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
              </span>
              {error && (
                <span className="text-xs text-red-400">{error}</span>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!userAnswer.trim() || submitting}
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Submit for AI Evaluation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
