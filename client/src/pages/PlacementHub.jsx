import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

// ─── Axios instance ───
const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mockly_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const ROLES = ['SDE', 'DATA SCIENTIST', 'PM', 'DATA ANALYST'];

const MAX_ATTEMPTS = 3;

// ─── Round metadata ───
const ROUNDS = [
  {
    key: 'aptitude',
    label: 'Aptitude',
    subtitle: 'MCQ — Rule-based Scoring',
    passScore: 70,
    icon: '🧮',
    color: 'from-orange-500 to-amber-500',
    ringColor: 'ring-orange-500/30',
    glowColor: 'shadow-orange-500/20',
    description: '10 multiple-choice questions testing logical reasoning and quantitative skills.',
    unlockRequires: null,
  },
  {
    key: 'technical',
    label: 'Technical',
    subtitle: 'Subjective — Hybrid AI Scoring',
    passScore: 75,
    icon: '💻',
    color: 'from-blue-500 to-indigo-500',
    ringColor: 'ring-blue-500/30',
    glowColor: 'shadow-blue-500/20',
    description: '10 technical questions (3 Easy, 4 Medium, 3 Hard) evaluated by keyword + embedding + LLM.',
    unlockRequires: 'aptitude',
  },
  {
    key: 'hr',
    label: 'HR',
    subtitle: 'Behavioral — LLM-Heavy Scoring',
    passScore: 70,
    icon: '🤝',
    color: 'from-teal-500 to-emerald-500',
    ringColor: 'ring-teal-500/30',
    glowColor: 'shadow-teal-500/20',
    description: '10 behavioral & soft-skill questions scored primarily by LLM reasoning.',
    unlockRequires: 'technical',
  },
];

// ─── Status Badge ───
function StatusBadge({ status }) {
  const map = {
    passed: { label: '✓ Passed', cls: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30' },
    failed: { label: '✗ Failed', cls: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30' },
    locked: { label: '🔒 Locked', cls: 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30' },
    active: { label: '▶ In Progress', cls: 'bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30' },
    unlocked: { label: '○ Not Started', cls: 'bg-white/5 text-slate-500 ring-1 ring-white/10' },
    gated: { label: '🔐 Locked', cls: 'bg-slate-600/15 text-slate-500 ring-1 ring-slate-600/20' },
  };
  const { label, cls } = map[status] || map.gated;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ─── Attempt Pips ───
function AttemptPips({ used, max }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all ${
            i < used ? 'bg-red-400' : 'bg-white/15'
          }`}
        />
      ))}
      <span className="text-xs text-slate-500 ml-1">
        {max - used} attempt{max - used !== 1 ? 's' : ''} left
      </span>
    </div>
  );
}

// ─── Score Ring ───
function ScoreRing({ score, color }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score ?? 0));
  const dash = (pct / 100) * circ;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={r} fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-sm font-bold text-white">{pct}</span>
    </div>
  );
}

// ─── Round Card ───
function RoundCard({ round, roundData, isUnlocked, onStart, loading }) {
  const attempts = roundData?.attemptsCount ?? 0;
  const passed = roundData?.passed ?? false;
  const locked = roundData?.locked ?? false;
  const score = roundData?.score ?? null;

  const status = locked
    ? 'locked'
    : passed
    ? 'passed'
    : !isUnlocked
    ? 'gated'
    : attempts > 0
    ? 'active'
    : 'unlocked';

  const canStart = isUnlocked && !locked && !passed;

  return (
    <div
      className={`glass-card p-6 flex flex-col gap-5 transition-all duration-300 ${
        isUnlocked && !locked ? `ring-1 ${round.ringColor} shadow-lg ${round.glowColor}` : 'opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${round.color} flex items-center justify-center text-2xl shadow-md`}
          >
            {round.icon}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg leading-tight">{round.label} Round</h3>
            <p className="text-xs text-slate-400 mt-0.5">{round.subtitle}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Description */}
      <p className="text-sm text-slate-400 leading-relaxed">{round.description}</p>

      {/* Pass score info */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Pass threshold: <span className="text-slate-300 font-medium">{round.passScore}%</span></span>
        {score !== null && <ScoreRing score={score} color={round.color} />}
      </div>

      {/* Attempts */}
      {attempts > 0 && (
        <AttemptPips used={attempts} max={MAX_ATTEMPTS} />
      )}

      {/* Action */}
      <button
        id={`btn-start-${round.key}`}
        disabled={!canStart || loading}
        onClick={() => onStart(round.key)}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
          passed
            ? 'bg-emerald-500/15 text-emerald-400 cursor-default'
            : locked
            ? 'bg-slate-500/10 text-slate-600 cursor-not-allowed'
            : !isUnlocked
            ? 'bg-white/5 text-slate-600 cursor-not-allowed'
            : loading
            ? 'bg-indigo-600/50 text-indigo-300 cursor-wait'
            : `bg-gradient-to-r ${round.color} text-white hover:opacity-90 hover:scale-[1.02] shadow-lg`
        }`}
      >
        {passed
          ? '✓ Round Completed'
          : locked
          ? '🔒 Locked (Max Attempts Reached)'
          : !isUnlocked
          ? `🔐 Complete ${round.unlockRequires ? round.unlockRequires.charAt(0).toUpperCase() + round.unlockRequires.slice(1) : ''} Round First`
          : loading
          ? 'Starting…'
          : attempts === 0
          ? `Start ${round.label} Round`
          : `Retry ${round.label} Round (Attempt ${attempts + 1}/${MAX_ATTEMPTS})`}
      </button>
    </div>
  );
}

// ─── Role Selector ───
function RoleSelector({ selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ROLES.map((r) => (
        <button
          key={r}
          id={`role-btn-${r.replace(/\s+/g, '-').toLowerCase()}`}
          onClick={() => onChange(r)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            selected === r
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

// ─── Placement Complete Banner ───
function PlacementCompleteBanner({ role }) {
  return (
    <div className="glass-card p-8 text-center space-y-4 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10">
      <div className="text-5xl">🎉</div>
      <h2 className="text-2xl font-bold text-white">Placement Simulation Complete!</h2>
      <p className="text-slate-400">
        You successfully cleared all 3 rounds of the <span className="text-white font-medium">{role}</span> placement simulation.
      </p>
      <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
        ✓ All Rounds Passed
      </span>
    </div>
  );
}

// ─── Main Page ───
export default function PlacementHub() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [attempt, setAttempt] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [startLoading, setStartLoading] = useState(null); // which round is starting
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async (role) => {
    setLoadingStatus(true);
    setError(null);
    try {
      const { data } = await api.get(`/placement/status?role=${role}`);
      setAttempt(data.attempt);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load placement status');
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus(selectedRole);
  }, [selectedRole, fetchStatus]);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setAttempt(null);
  };

  const handleStartRound = async (roundKey) => {
    setStartLoading(roundKey);
    setError(null);
    try {
      if (roundKey === 'aptitude') {
        const { data } = await api.post('/placement/aptitude/start', { role: selectedRole });
        if (data.alreadyPassed) {
          await fetchStatus(selectedRole);
          return;
        }
        // Navigate to aptitude workspace with questions
        navigate('/placement/aptitude', {
          state: {
            role: selectedRole,
            questions: data.questions,
            attempt: data.attempt,
          },
        });
      } else if (roundKey === 'technical') {
        const { data } = await api.post('/placement/technical/start', { role: selectedRole });
        if (data.alreadyPassed) {
          await fetchStatus(selectedRole);
          return;
        }
        navigate(`/mock/${data.session._id}`, {
          state: { placementRole: selectedRole, placementRound: 'technical' },
        });
      } else if (roundKey === 'hr') {
        const { data } = await api.post('/placement/hr/start', { role: selectedRole });
        if (data.alreadyPassed) {
          await fetchStatus(selectedRole);
          return;
        }
        navigate(`/mock/${data.session._id}`, {
          state: { placementRole: selectedRole, placementRound: 'hr' },
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to start ${roundKey} round`;
      setError(msg);
      await fetchStatus(selectedRole);
    } finally {
      setStartLoading(null);
    }
  };

  const roundsData = attempt?.rounds ?? {};
  const aptitudePassed = roundsData.aptitude?.passed ?? false;
  const technicalPassed = roundsData.technical?.passed ?? false;
  const allPassed = attempt?.status === 'passed';

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Page Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-violet-500/30">
              🏆
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Placement Simulation</h1>
              <p className="text-sm text-slate-400">Complete 3 rounds to simulate a real placement interview</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-900 to-amber-700 transition-all duration-700"
                style={{
                  width: allPassed ? '100%' : technicalPassed ? '66%' : aptitudePassed ? '33%' : '0%',
                }}
              />
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap">
              {allPassed ? '3/3' : technicalPassed ? '2/3' : aptitudePassed ? '1/3' : '0/3'} rounds cleared
            </span>
          </div>
        </div>

        {/* Role Selector */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Target Role</h2>
          <RoleSelector selected={selectedRole} onChange={handleRoleChange} />
        </div>

        {/* Loading state */}
        {loadingStatus && (
          <div className="flex items-center justify-center py-16">
            <div className="spinner w-8 h-8" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="glass-card p-4 border border-red-500/20 bg-red-500/5">
            <p className="text-sm text-red-400">⚠ {error}</p>
          </div>
        )}

        {/* Placement Complete */}
        {!loadingStatus && allPassed && <PlacementCompleteBanner role={selectedRole} />}

        {/* Round Cards */}
        {!loadingStatus && !allPassed && (
          <div className="grid md:grid-cols-3 gap-5">
            {ROUNDS.map((round) => {
              const isUnlocked = round.unlockRequires
                ? (roundsData[round.unlockRequires]?.passed ?? false)
                : true;

              return (
                <RoundCard
                  key={round.key}
                  round={round}
                  roundData={roundsData[round.key]}
                  isUnlocked={isUnlocked}
                  onStart={handleStartRound}
                  loading={startLoading === round.key}
                />
              );
            })}
          </div>
        )}

        {/* Tips section */}
        {!loadingStatus && (
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">📋 How it works</h3>
            <ul className="space-y-1.5 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-0.5">①</span>
                <span><span className="text-orange-300 font-medium">Aptitude</span> — Answer 10 MCQs. Score ≥ 70% to advance.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">②</span>
                <span><span className="text-blue-300 font-medium">Technical</span> — 10 subjective questions graded by hybrid AI. Score ≥ 75%.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">③</span>
                <span><span className="text-teal-300 font-medium">HR</span> — Behavioral questions with LLM-heavy evaluation. Score ≥ 70%.</span>
              </li>
              <li className="flex items-start gap-2 mt-1">
                <span className="text-red-400 mt-0.5">⚠</span>
                <span>Each round allows a maximum of 3 attempts. Failing 3 times locks that round.</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
