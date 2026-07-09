import React, { useState, useEffect } from 'react';
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

function ScoreCircle({ score }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="180" height="180" className="transform -rotate-90">
        <circle
          cx="90" cy="90" r={radius}
          stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none"
        />
        <circle
          cx="90" cy="90" r={radius}
          stroke={color} strokeWidth="8" fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-4xl font-bold text-slate-100">{score}%</p>
        <p className="text-xs text-slate-500">Overall Score</p>
      </div>
    </div>
  );
}

function QuestionAccordion({ answer, question, index }) {
  const [expanded, setExpanded] = useState(false);
  const score = answer.overallScore ?? 0;
  const scoreColor = score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-all"
      >
        {/* Question number */}
        <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-slate-300 flex-shrink-0">
          {index + 1}
        </span>

        {/* Question text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-300 line-clamp-1">{question.text}</p>
          <div className="flex gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[question.type] || TYPE_COLORS.technical}`}>
              {question.type}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[question.difficulty] || DIFFICULTY_COLORS.easy}`}>
              {question.difficulty}
            </span>
          </div>
        </div>

        {/* Score */}
        <span className={`text-lg font-bold ${scoreColor} flex-shrink-0`}>
          {score}%
        </span>

        {/* Chevron */}
        <svg
          className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      <div
        className={`border-t border-white/10 transition-all duration-300 ease-in-out overflow-hidden ${
          expanded ? 'max-h-[1200px] opacity-100 p-5 space-y-5' : 'max-h-0 opacity-0 p-0 pointer-events-none'
        }`}
      >
        {/* User's answer */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Your Answer</h4>
          <p className="text-sm text-slate-300 bg-white/5 rounded-lg p-3 leading-relaxed">
            {answer.userAnswer || <span className="text-slate-600 italic">No answer provided</span>}
          </p>
        </div>

        {/* Score breakdown */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Score Breakdown</h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Keyword', score: answer.keywordScore, color: 'indigo' },
              { label: 'Embedding', score: answer.embeddingScore, color: 'violet' },
              { label: 'LLM', score: answer.llmScore, color: 'purple' },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                <p className={`text-lg font-bold text-${s.color}-400`}>{s.score ?? 0}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback sections */}
        {answer.strengths && answer.strengths.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">✓ Strengths</h4>
            <ul className="space-y-1">
              {answer.strengths.map((s, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-emerald-500 mt-1 flex-shrink-0">•</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {answer.weaknesses && answer.weaknesses.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">✗ Weaknesses</h4>
            <ul className="space-y-1">
              {answer.weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-red-500 mt-1 flex-shrink-0">•</span> {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {answer.suggestions && answer.suggestions.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">💡 Suggestions</h4>
            <ul className="space-y-1">
              {answer.suggestions.map((s, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-amber-500 mt-1 flex-shrink-0">•</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MockScorecard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/sessions/${id}`);
        if (!data.session || data.session.status !== 'completed') {
          navigate('/questions');
          return;
        }
        setSession(data.session);
      } catch (err) {
        console.error('Failed to load scorecard:', err);
        navigate('/questions');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading || !session) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="bg-orb w-96 h-96 bg-indigo-600 top-[-5%] left-[-5%]" />
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="spinner" style={{ width: '3rem', height: '3rem' }} />
        </div>
      </div>
    );
  }

  const elapsed = Math.floor(
    (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="bg-orb w-96 h-96 bg-indigo-600 top-[-5%] left-[-5%]" />
      <div className="bg-orb w-72 h-72 bg-violet-600 bottom-[10%] right-[-3%]" style={{ animationDelay: '3s' }} />

      <Navbar />

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 page-enter">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Mock Interview Results</h1>
          <p className="text-slate-400 text-sm">
            {session.role} Session completed in {elapsed} minutes on{' '}
            {new Date(session.completedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Overall Score */}
        <div className="flex justify-center mb-10">
          <ScoreCircle score={session.overallScore || 0} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-10 max-w-xl mx-auto">
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Questions</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{session.questions.length}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Time Taken</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{elapsed} min</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Answered</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">
              {session.answers.filter((a) => a.userAnswer && a.userAnswer.trim() !== '').length}
            </p>
          </div>
        </div>

        {/* Question breakdown */}
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Question Breakdown</h2>
        <div className="space-y-3">
          {session.questions.map((q, idx) => {
            const answer = session.answers.find(
              (a) => (a.question._id || a.question).toString() === q._id.toString()
            ) || {};
            return <QuestionAccordion key={q._id} question={q} answer={answer} index={idx} />;
          })}
        </div>

        {/* Back button */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
          >
            View Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
