import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import Navbar from '../components/Navbar';

// Axios instance configured with auth header
const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mockly_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const TYPE_COLORS = {
  technical: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  behavioral: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  hr: 'text-teal-400 border-teal-500/30 bg-teal-500/10',
  aptitude: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
};

const DIFFICULTY_COLORS = {
  easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  hard: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState('all');
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, recsRes] = await Promise.all([
        api.get('/dashboard/stats', { params: { range } }),
        api.get('/dashboard/recommendations')
      ]);
      setStats(statsRes.data);
      setRecommendations(recsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRangeChange = (e) => {
    setRange(e.target.value);
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-12">
      {/* Background orbs */}
      <div className="bg-orb w-96 h-96 bg-indigo-600 top-[-5%] left-[-5%]" />
      <div className="bg-orb w-72 h-72 bg-violet-600 bottom-[10%] right-[-3%]" style={{ animationDelay: '3s' }} />

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100 bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
              Progress Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Analyze your performance metrics and resume targeted practice
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 font-medium">Time Range:</span>
            <select
              value={range}
              onChange={handleRangeChange}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="7days" className="bg-slate-900 text-slate-300">Last 7 Days</option>
              <option value="30days" className="bg-slate-900 text-slate-300">Last 30 Days</option>
              <option value="all" className="bg-slate-900 text-slate-300">All-Time</option>
            </select>
          </div>
        </div>

        {loading && !stats ? (
          /* Initial loading skeletons */
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card h-28 bg-white/5" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-card h-80 bg-white/5" />
              <div className="glass-card h-80 bg-white/5" />
            </div>
          </div>
        ) : stats?.totalQuestionsPracticed === 0 ? (
          /* Empty state */
          <div className="glass-card p-12 text-center max-w-xl mx-auto mt-12 page-enter">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">No Practice History Yet</h2>
            <p className="text-slate-400 text-sm mb-6">
              Start practicing technical, behavioral, or HR questions to populate your visual charts.
            </p>
            <button onClick={() => navigate('/questions')} className="btn-primary">
              Browse Questions
            </button>
          </div>
        ) : (
          /* Dashboard Content */
          <div className="space-y-8 page-enter">
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="glass-card p-6 flex items-center justify-between hover:bg-white/10 transition-all duration-300">
                <div>
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Practiced</span>
                  <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{stats?.totalQuestionsPracticed}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  ✓
                </div>
              </div>
              {/* Card 2 */}
              <div className="glass-card p-6 flex items-center justify-between hover:bg-white/10 transition-all duration-300">
                <div>
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Average Score</span>
                  <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{stats?.avgScore}%</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  %
                </div>
              </div>
              {/* Card 3 */}
              <div className="glass-card p-6 flex items-center justify-between hover:bg-white/10 transition-all duration-300">
                <div>
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Mock Sessions</span>
                  <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{stats?.activeSessions}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  ⌛
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chronological Score Progression (Line Chart) */}
              <div className="glass-card p-6">
                <h3 className="text-base font-semibold text-slate-200 mb-6">Score Progression per Topic</h3>
                {stats?.lineChartData?.length === 0 ? (
                  <div className="h-72 flex items-center justify-center text-slate-500 text-sm">No data available</div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats?.lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="attemptIndex" stroke="#94a3b8" fontSize={11} label={{ value: 'Attempts', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                        <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} labelClassName="text-slate-400 text-xs" />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                        <Line name="Technical" type="monotone" dataKey="technical" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} connectNulls />
                        <Line name="Behavioral" type="monotone" dataKey="behavioral" stroke="#a855f7" strokeWidth={2.5} connectNulls />
                        <Line name="HR" type="monotone" dataKey="hr" stroke="#14b8a6" strokeWidth={2.5} connectNulls />
                        <Line name="Aptitude" type="monotone" dataKey="aptitude" stroke="#f97316" strokeWidth={2.5} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Topic Mastery (Radar Chart) */}
              <div className="glass-card p-6">
                <h3 className="text-base font-semibold text-slate-200 mb-6">Topic Mastery Index</h3>
                <div className="h-72 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={stats?.radarChartData}>
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={9} />
                      <Radar name="Average Score" dataKey="A" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.4} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recommendations Panel */}
            {recommendations.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-200">Recommended for You</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recommendations.map((q) => (
                    <div key={q._id} className="glass-card p-5 flex flex-col justify-between hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-300">
                      <div>
                        <div className="flex gap-2 mb-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${TYPE_COLORS[q.type] || TYPE_COLORS.technical}`}>
                            {q.type.toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${DIFFICULTY_COLORS[q.difficulty] || DIFFICULTY_COLORS.easy}`}>
                            {q.difficulty.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed mb-6 font-medium">
                          {q.text}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/practice/${q._id}`)}
                        className="w-full py-2.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white text-xs font-semibold border border-indigo-500/20 hover:border-transparent transition-all duration-300"
                      >
                        Practice Now →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
