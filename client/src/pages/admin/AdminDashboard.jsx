import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mockly_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Stat Card ───
function StatCard({ label, value, icon, sub, colorClass }) {
  return (
    <div className={`glass-card p-6 space-y-3 ring-1 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-white tabular-nums">{value ?? '—'}</div>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// ─── Mini bar chart ───
function MiniBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 capitalize">{label}</span>
        <span className="text-slate-300 font-medium tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Recent Users Table ───
function RecentUsersTable({ users }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-slate-200">Recent Signups</h3>
      </div>
      <div className="divide-y divide-white/5">
        {users.map((u) => (
          <div key={u._id} className="flex items-center gap-3 px-5 py-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-semibold text-white shrink-0">
              {u.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-200 font-medium truncate">{u.name}</p>
              <p className="text-xs text-slate-500 truncate">{u.email}</p>
            </div>
            <span className="ml-auto text-xs text-slate-500 whitespace-nowrap">
              {new Date(u.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
        {users.length === 0 && (
          <p className="px-5 py-6 text-sm text-slate-500 text-center">No users yet</p>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ───
function Skeleton({ className }) {
  return <div className={`bg-white/5 rounded-xl animate-pulse ${className}`} />;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/admin/stats');
        setStats(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalByType = stats
    ? Object.values(stats.questionsByType || {}).reduce((s, v) => s + v, 0)
    : 0;

  const TYPE_COLORS = {
    technical: 'bg-blue-500',
    behavioral: 'bg-purple-500',
    hr: 'bg-teal-500',
    aptitude: 'bg-orange-500',
  };
  const DIFF_COLORS = {
    easy: 'bg-emerald-500',
    medium: 'bg-amber-500',
    hard: 'bg-red-500',
  };

  return (
    <AdminLayout>
      <div className="px-8 py-8 space-y-8 max-w-6xl">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Platform-wide metrics at a glance</p>
        </div>

        {error && (
          <div className="glass-card p-4 border border-red-500/20 bg-red-500/5">
            <p className="text-sm text-red-400">⚠ {error}</p>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
          ) : (
            <>
              <StatCard
                label="Total Users"
                value={stats?.totalUsers}
                icon="👤"
                sub={`${stats?.totalStudents} students`}
                colorClass="ring-indigo-500/20 shadow-indigo-500/10 shadow-lg"
              />
              <StatCard
                label="Total Questions"
                value={stats?.totalQuestions}
                icon="❓"
                sub={`${stats?.activeQuestions} active`}
                colorClass="ring-blue-500/20 shadow-blue-500/10 shadow-lg"
              />
              <StatCard
                label="Total Attempts"
                value={stats?.totalAttempts?.toLocaleString()}
                icon="📝"
                sub="Practice attempts"
                colorClass="ring-violet-500/20 shadow-violet-500/10 shadow-lg"
              />
              <StatCard
                label="Platform Avg Score"
                value={stats?.platformAvgScore ? `${stats.platformAvgScore}%` : '—'}
                icon="🎯"
                sub="Across all attempts"
                colorClass="ring-emerald-500/20 shadow-emerald-500/10 shadow-lg"
              />
            </>
          )}
        </div>

        {/* Charts row */}
        <div className="grid md:grid-cols-3 gap-5">
          {/* Questions by type */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">Questions by Type</h3>
            {loading ? (
              <Skeleton className="h-24" />
            ) : (
              <div className="space-y-3">
                {Object.entries(stats?.questionsByType || {}).map(([type, count]) => (
                  <MiniBar
                    key={type}
                    label={type}
                    count={count}
                    total={totalByType}
                    color={TYPE_COLORS[type] || 'bg-slate-500'}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Questions by difficulty */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">Questions by Difficulty</h3>
            {loading ? (
              <Skeleton className="h-24" />
            ) : (
              <div className="space-y-3">
                {['easy', 'medium', 'hard'].map((diff) => (
                  <MiniBar
                    key={diff}
                    label={diff}
                    count={stats?.questionsByDifficulty?.[diff] || 0}
                    total={totalByType}
                    color={DIFF_COLORS[diff]}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">Quick Actions</h3>
            {[
              { label: 'Manage Questions', path: '/admin/questions', icon: '❓', color: 'text-blue-400' },
              { label: 'Manage Roles', path: '/admin/roles', icon: '🏷️', color: 'text-purple-400' },
              { label: 'View All Users', path: '/admin/users', icon: '👥', color: 'text-teal-400' },
            ].map((action) => (
              <a
                key={action.path}
                href={action.path}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/8 transition-all group"
              >
                <span className={`text-lg ${action.color}`}>{action.icon}</span>
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                  {action.label}
                </span>
                <span className="ml-auto text-slate-600 group-hover:text-slate-400 transition-colors">→</span>
              </a>
            ))}
          </div>
        </div>

        {/* Recent users */}
        {!loading && stats?.recentUsers && (
          <RecentUsersTable users={stats.recentUsers} />
        )}
      </div>
    </AdminLayout>
  );
}
