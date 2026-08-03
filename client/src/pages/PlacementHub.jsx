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
    passed: { label: '✓ Passed', cls: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200' },
    failed: { label: '✗ Failed', cls: 'bg-red-100 text-red-800 ring-1 ring-red-200' },
    locked: { label: '🔒 Locked', cls: 'bg-stone-200 text-stone-600 ring-1 ring-stone-300' },
    active: { label: '▶ In Progress', cls: 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200' },
    unlocked: { label: '○ Not Started', cls: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200' },
    gated: { label: '🔐 Locked', cls: 'bg-stone-200 text-stone-600 ring-1 ring-stone-300' },
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
      <span className="text-xs text-stone-500 ml-1">
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
      <span className="absolute text-sm font-bold text-stone-900">{pct}</span>
    </div>
  );
}

// ─── Attempt Breakdown (reusable per-attempt audit timeline) ───
function TrialsBreakdown({ roundData, roundKey, navigate }) {
  let trials = roundData?.trials || [];

  // Fallback: If legacy document has fewer trials recorded in array than attemptsCount,
  // fill in synthetic trial records so older attempts still show a full trial history!
  if (trials.length < roundData?.attemptsCount && roundData?.attemptsCount > 0) {
    const total = roundData.attemptsCount;
    const finalScore = roundData.score ?? 0;
    const finalPassed = roundData.passed ?? false;

    const existingMap = new Map(trials.map((t) => [t.trialNumber, t]));
    trials = [];

    for (let i = 1; i <= total; i++) {
      if (existingMap.has(i)) {
        trials.push(existingMap.get(i));
      } else {
        const isFinal = i === total;
        trials.push({
          trialNumber: i,
          score: isFinal ? finalScore : Math.max(30, finalScore - (total - i) * 15),
          passed: isFinal ? finalPassed : false,
          sessionId: isFinal ? roundData.sessionId : null,
          completedAt: isFinal ? roundData.completedAt : null,
        });
      }
    }
  }

  if (trials.length === 0) return null;

  return (
    <div className="space-y-2.5 pt-3 border-t border-stone-200/80 mt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
          <span className="text-amber-800 text-xs">⚡</span>
          <span>Attempt Breakdown</span>
        </p>
        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
          {trials.length} {trials.length === 1 ? 'Attempt' : 'Attempts'}
        </span>
      </div>

      {/* Attempt Items */}
      <div className="space-y-2">
        {trials
          .sort((a, b) => a.trialNumber - b.trialNumber)
          .map((trial) => {
            const scorePct = Math.max(0, Math.min(100, trial.score ?? 0));
            const isPassed = trial.passed;

            return (
              <div
                key={trial.trialNumber}
                className={`relative overflow-hidden rounded-xl border p-3 transition-all duration-200 ${
                  isPassed
                    ? 'border-emerald-300/90 bg-gradient-to-r from-emerald-50/80 via-teal-50/30 to-white shadow-xs hover:border-emerald-400 hover:shadow-sm'
                    : 'border-rose-200 bg-gradient-to-r from-rose-50/80 via-orange-50/20 to-white hover:border-rose-300 shadow-2xs'
                }`}
              >
                {/* Left accent bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    isPassed ? 'bg-emerald-500' : 'bg-rose-400'
                  }`}
                />

                <div className="flex flex-wrap items-center justify-between gap-2.5 pl-2">
                  {/* Left section: Badge, Score, Result */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-lg shadow-2xs ${
                        isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      Attempt #{trial.trialNumber}
                    </span>

                    {/* Score display with micro bar */}
                    <div className="flex items-center gap-2 bg-white/90 border border-stone-200/90 px-2.5 py-1 rounded-lg shadow-2xs">
                      <span className="font-extrabold text-stone-900 text-xs tabular-nums">
                        {trial.score}%
                      </span>
                      <div className="w-10 h-1.5 rounded-full bg-stone-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPassed ? 'bg-emerald-500' : 'bg-rose-400'
                          }`}
                          style={{ width: `${scorePct}%` }}
                        />
                      </div>
                    </div>

                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        isPassed
                          ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100/90 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {isPassed ? '✓ Passed' : '✕ Failed'}
                    </span>
                  </div>

                  {/* Right section: Timestamp & Action button */}
                  <div className="flex items-center gap-2 ml-auto">
                    {trial.completedAt && (
                      <span className="text-[11px] font-medium text-stone-400">
                        {new Date(trial.completedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                    {trial.sessionId && (roundKey === 'technical' || roundKey === 'hr') && (
                      <button
                        onClick={() => navigate(`/mock/scorecard/${trial.sessionId}`)}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-200 shadow-xs hover:scale-[1.02] active:scale-95 ${
                          isPassed
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600'
                            : 'bg-amber-900 hover:bg-amber-950 text-white border border-amber-900'
                        }`}
                      >
                        <span>View Evaluation</span>
                        <span className="text-[10px]">→</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ─── Round Card ───
function RoundCard({ round, roundData, isUnlocked, onStart, onUnlock, loading, unlockLoading, navigate }) {
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
            <h3 className="font-bold text-stone-900 text-lg leading-tight">{round.label} Round</h3>
            <p className="text-xs text-stone-600 mt-0.5">{round.subtitle}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Description */}
      <p className="text-sm text-stone-700 leading-relaxed">{round.description}</p>

      {/* Pass score info */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-stone-600">Pass threshold: <span className="text-stone-800 font-medium">{round.passScore}%</span></span>
        {score !== null && <ScoreRing score={score} color={round.color} />}
      </div>

      {/* Attempts */}
      {attempts > 0 && !locked && (
        <AttemptPips used={attempts} max={MAX_ATTEMPTS} />
      )}

      {/* Per-Trial Breakdown */}
      {attempts > 0 && (
        <TrialsBreakdown roundData={roundData} roundKey={round.key} navigate={navigate} />
      )}

      {/* ── LOCKED UNLOCK BANNER ── */}
      {locked && (
        <div className="rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-50 to-orange-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <p className="text-sm font-semibold text-amber-900">
              All 3 attempts used — round is locked
            </p>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Complete a Mock Interview and score{' '}
            <span className="font-bold">≥ {round.passScore}%</span> to unlock this round and get
            3 fresh attempts.
          </p>
          <button
            id={`btn-unlock-${round.key}`}
            disabled={unlockLoading}
            onClick={() => onUnlock(round.key)}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              unlockLoading
                ? 'bg-amber-200 text-amber-700 cursor-wait'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 hover:scale-[1.02] shadow-lg shadow-amber-500/25'
            }`}
          >
            {unlockLoading ? 'Starting Unlock Interview…' : `⚡ Attempt Mock Interview to Unlock`}
          </button>
        </div>
      )}

      {/* Normal Action button (shown when not locked) */}
      {!locked && (
        <button
          id={`btn-start-${round.key}`}
          disabled={!canStart || loading}
          onClick={() => onStart(round.key)}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
            passed
              ? 'bg-emerald-100 text-emerald-800 cursor-default'
              : !isUnlocked
              ? 'bg-stone-100 text-stone-600 cursor-not-allowed border border-stone-200'
              : loading
              ? 'bg-amber-900/50 text-white cursor-wait'
              : `bg-gradient-to-r ${round.color} text-white hover:opacity-90 hover:scale-[1.02] shadow-lg`
          }`}
        >
          {passed
            ? '✓ Round Completed'
            : !isUnlocked
            ? `🔐 Complete ${round.unlockRequires ? round.unlockRequires.charAt(0).toUpperCase() + round.unlockRequires.slice(1) : ''} Round First`
            : loading
            ? 'Starting…'
            : attempts === 0
            ? `Start ${round.label} Round`
            : `Retry ${round.label} Round (Attempt ${attempts + 1}/${MAX_ATTEMPTS})`}
        </button>
      )}
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
              ? 'bg-gradient-to-r from-amber-900 to-amber-700 text-white shadow-lg shadow-amber-900/25'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900 border border-stone-300'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

// ─── Placement Complete Banner ───
function PlacementCompleteBanner({ role, onReset, resetting }) {
  return (
    <div className="glass-card p-8 text-center space-y-5 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10">
      <div className="text-5xl">🎉</div>
      <h2 className="text-2xl font-bold text-stone-900">Placement Simulation Complete!</h2>
      <p className="text-stone-650 max-w-lg mx-auto">
        You successfully cleared all 3 rounds of the <span className="text-stone-900 font-bold">{role}</span> placement simulation.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-850 ring-1 ring-emerald-250">
          ✓ All Rounds Passed
        </span>
        <button
          id="btn-reset-placement"
          disabled={resetting}
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-amber-800 to-amber-900 text-white hover:opacity-90 transition-all shadow-md hover:scale-[1.02] disabled:opacity-50"
        >
          {resetting ? 'Resetting…' : '🔄 Re-attempt All Rounds'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function PlacementHub() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [attempt, setAttempt] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [startLoading, setStartLoading] = useState(null); // which round is starting
  const [unlockLoading, setUnlockLoading] = useState(null); // which round is unlocking
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async (role) => {
    setLoadingStatus(true);
    setError(null);
    try {
      const { data } = await api.get(`/placement/status?role=${role}`);
      setAttempt(data.attempt);
      setHistory(data.history || []);
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
    setHistory([]);
    setShowHistory(false);
  };

  const handleResetPlacement = async () => {
    setResetting(true);
    setError(null);
    try {
      await api.post('/placement/reset', { role: selectedRole });
      await fetchStatus(selectedRole);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset placement rounds');
    } finally {
      setResetting(false);
    }
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

  /**
   * Handle clicking "Attempt Mock Interview to Unlock" on a locked round.
   * Calls /api/placement/unlock/start and navigates to the appropriate workspace.
   */
  const handleUnlockRound = async (roundKey) => {
    setUnlockLoading(roundKey);
    setError(null);
    try {
      const { data } = await api.post('/placement/unlock/start', {
        role: selectedRole,
        roundKey,
      });

      if (roundKey === 'aptitude') {
        // Aptitude unlock → go to AptitudeWorkspace with isUnlockSession flag
        navigate('/placement/aptitude', {
          state: {
            role: selectedRole,
            questions: data.questions,
            attempt: attempt,
            isUnlockSession: true,
            roundKey,
          },
        });
      } else {
        // Technical / HR unlock → go to MockInterview with isUnlock flag
        navigate(`/mock/${data.session._id}`, {
          state: {
            placementRole: selectedRole,
            placementRound: roundKey,
            isUnlock: true,
          },
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to start unlock session for ${roundKey}`;
      setError(msg);
    } finally {
      setUnlockLoading(null);
    }
  };

  const roundsData = attempt?.rounds ?? {};
  const aptitudePassed = roundsData.aptitude?.passed ?? false;
  const technicalPassed = roundsData.technical?.passed ?? false;
  const allPassed = attempt?.status === 'passed';

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Page Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 border border-stone-200 rounded-2xl p-4 bg-white/60">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-violet-500/30">
              🏆
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Placement Simulation</h1>
              <p className="text-sm text-stone-600">Complete 3 rounds to simulate a real placement interview</p>
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
            <span className="text-xs text-stone-500 whitespace-nowrap">
              {allPassed ? '3/3' : technicalPassed ? '2/3' : aptitudePassed ? '1/3' : '0/3'} rounds cleared
            </span>
          </div>
        </div>

        {/* Role Selector */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Target Role</h2>
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

        {/* Placement Complete Banner */}
        {!loadingStatus && allPassed && (
          <PlacementCompleteBanner
            role={selectedRole}
            onReset={handleResetPlacement}
            resetting={resetting}
          />
        )}

        {/* Round Cards */}
        {!loadingStatus && (
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
                  onUnlock={handleUnlockRound}
                  loading={startLoading === round.key}
                  unlockLoading={unlockLoading === round.key}
                  navigate={navigate}
                />
              );
            })}
          </div>
        )}

        {/* ─── Placement Attempts History (Inline Expandable) ─── */}
        {!loadingStatus &&
          history.filter((h) => !h.isLatest || h.status === 'failed' || h.status === 'passed').length > 0 && (
            <div className="space-y-4">
              <button
                id="btn-toggle-history"
                onClick={() => setShowHistory((v) => !v)}
                className="w-full glass-card p-4 flex items-center justify-between group hover:ring-1 hover:ring-amber-500/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">📜</span>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-stone-900">
                      Placement Attempts History
                    </h3>
                    <p className="text-xs text-stone-500">
                      {history.filter((h) => !h.isLatest || h.status === 'failed' || h.status === 'passed').length} attempt record(s) for {selectedRole}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-stone-400 text-sm transition-transform duration-300 ${
                    showHistory ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </button>

              {showHistory && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {history
                    .filter((h) => !h.isLatest || h.status === 'failed' || h.status === 'passed')
                    .sort((a, b) => b.attemptNumber - a.attemptNumber)
                    .map((pastAttempt) => {
                    const r = pastAttempt.rounds || {};
                    const statusMap = {
                      passed: { label: '🎉 Cleared Placement', cls: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200' },
                      failed: { label: '❌ Drive Failed', cls: 'bg-red-100 text-red-800 ring-1 ring-red-200' },
                      in_progress: { label: '▶ In Progress', cls: 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200' },
                    };
                    const badge = statusMap[pastAttempt.status] || statusMap.in_progress;

                    return (
                      <div
                        key={pastAttempt._id}
                        className="glass-card p-5 space-y-4 border-l-4 border-l-amber-500/40"
                      >
                        {/* Attempt Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-sm font-bold text-amber-900 border border-amber-200 shadow-sm">
                              #{pastAttempt.attemptNumber}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-stone-900">
                                Attempt #{pastAttempt.attemptNumber} — {selectedRole}
                              </h4>
                              <p className="text-xs text-stone-500">
                                {new Date(pastAttempt.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {/* 3-Round Score Breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {ROUNDS.map((round) => {
                            const rd = r[round.key] || {};
                            const hasScore = rd.score != null;
                            const isPassed = rd.passed === true;
                            const isLocked = rd.locked === true;
                            const attemptsUsed = rd.attemptsCount || 0;
                            const hasSession = !!rd.sessionId;
                            const wasGated = !hasScore && !isLocked && attemptsUsed === 0;

                            return (
                              <div
                                key={round.key}
                                className={`rounded-xl border p-3 space-y-2 ${
                                  isPassed
                                    ? 'border-emerald-200 bg-emerald-50/50'
                                    : isLocked
                                    ? 'border-red-200 bg-red-50/50'
                                    : wasGated
                                    ? 'border-stone-200 bg-stone-50/50'
                                    : 'border-stone-200 bg-white'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">{round.icon}</span>
                                    <span className="text-xs font-bold text-stone-800">
                                      {round.label}
                                    </span>
                                  </div>
                                  {isPassed && (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                      ✓ Passed
                                    </span>
                                  )}
                                  {isLocked && (
                                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                                      🔒 Locked
                                    </span>
                                  )}
                                  {wasGated && (
                                    <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                                      🔐 Gated
                                    </span>
                                  )}
                                  {!isPassed && !isLocked && !wasGated && hasScore && (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                      ✗ Failed
                                    </span>
                                  )}
                                </div>

                                {hasScore ? (
                                  <div className="flex items-end justify-between">
                                    <div>
                                      <p className="text-xl font-bold text-stone-900 tabular-nums">
                                        {rd.score}%
                                      </p>
                                      <p className="text-[10px] text-stone-500">
                                        {attemptsUsed}/{MAX_ATTEMPTS} attempts
                                      </p>
                                    </div>
                                    {hasSession && (round.key === 'technical' || round.key === 'hr') && (
                                      <button
                                        onClick={() => navigate(`/mock/scorecard/${rd.sessionId}`)}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-100/90 hover:bg-amber-200 px-3 py-1.5 rounded-lg border border-amber-300 transition-all shadow-2xs hover:scale-[1.02] active:scale-95"
                                      >
                                        <span>View Evaluation</span>
                                        <span className="text-[10px]">→</span>
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-stone-400 italic">Not attempted</p>
                                )}

                                {/* Per-Trial Breakdown in History */}
                                {attemptsUsed > 0 && (
                                  <TrialsBreakdown roundData={rd} roundKey={round.key} navigate={navigate} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Tips section */}
        {!loadingStatus && (
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-stone-800">📋 How it works</h3>
            <ul className="space-y-1.5 text-sm text-stone-600">
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-0.5">①</span>
                <span><span className="text-amber-900 font-bold">Aptitude</span> — Answer 10 MCQs. Score ≥ 70% to advance.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">②</span>
                <span><span className="text-blue-700 font-bold">Technical</span> — 10 subjective questions graded by hybrid AI. Score ≥ 75%.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">③</span>
                <span><span className="text-teal-700 font-bold">HR</span> — Behavioral questions with LLM-heavy evaluation. Score ≥ 70%.</span>
              </li>
              <li className="flex items-start gap-2 mt-1">
                <span className="text-red-400 mt-0.5">⚠</span>
                <span>Each round allows a maximum of 3 attempts. Failing 3 times locks that round.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">⚡</span>
                <span>Locked rounds can be unlocked by passing a <strong>Mock Interview</strong> at or above the round's pass threshold.</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
