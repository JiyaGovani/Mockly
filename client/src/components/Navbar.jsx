import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mockly_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showMockModal, setShowMockModal] = useState(false);
  const [roles, setRoles] = useState([]);
  const [mockRole, setMockRole] = useState('');
  const [startingMock, setStartingMock] = useState(false);

  // Hide navbar during active mock interview or placement round attempts
  const isMockAttempt = location.pathname.startsWith('/mock/') && !location.pathname.includes('/scorecard');
  const isPlacementRound = location.pathname === '/placement/aptitude';

  if (isMockAttempt || isPlacementRound) {
    return null;
  }

  const fetchRoles = async () => {
    try {
      const { data } = await api.get('/roles');
      setRoles(data.roles || []);
    } catch (err) {
      console.error('Failed to fetch roles in Navbar:', err);
    }
  };

  const handleOpenMockModal = () => {
    if (roles.length === 0) fetchRoles();
    setShowMockModal(true);
  };

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
      if (data.session && data.session._id) {
        navigate(`/mock/${data.session._id}`);
      }
    } catch (err) {
      console.error('Failed to start mock in Navbar:', err);
      alert(err.response?.data?.message || 'Error starting mock interview session');
    } finally {
      setStartingMock(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <>
      {/* Floating Pill SaaS Header — Glass blur covering above & behind navbar, clear below */}
      <header className="sticky top-0 z-50 pointer-events-none">
        {/* Backdrop blur layer above & behind navbar */}
        <div className="absolute inset-x-0 top-0 h-16 backdrop-blur-md bg-stone-50/50 pointer-events-none border-b border-stone-200/20" />

        <div className="relative px-4 md:px-8 py-3">
          <div className="pointer-events-auto max-w-7xl mx-auto flex items-center justify-between bg-white/85 backdrop-blur-xl border border-amber-900/15 rounded-full px-6 py-2.5 shadow-lg shadow-amber-900/5">
            {/* Left Group: Brand Logo & Left-aligned Links */}
            <div className="flex items-center gap-8">
              {/* Brand Logo */}
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => {
                  navigate('/');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-900 to-amber-700 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-amber-900/25">
                  M
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-amber-950 via-amber-900 to-amber-700 bg-clip-text text-transparent tracking-tight">
                  Mockly <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-900/10 text-amber-900 border border-amber-900/15 ml-0.5">AI</span>
                </span>
              </div>

              {/* Left-aligned Navigation Links */}
              {user && (
                <div className="hidden md:flex items-center gap-6 text-sm font-semibold">
                  {/* 1. Practise Questions */}
                  <button
                    onClick={() => navigate('/questions')}
                    className={`transition-colors ${location.pathname === '/questions'
                        ? 'text-amber-900 font-bold'
                        : 'text-stone-600 hover:text-amber-900'
                      }`}
                  >
                    Practise Questions
                  </button>

                  {/* 2. Attempt Mock */}
                  <button
                    onClick={handleOpenMockModal}
                    className="text-stone-600 hover:text-amber-900 transition-colors"
                  >
                    Attempt Mock
                  </button>

                  {/* 3. Placement */}
                  <button
                    onClick={() => navigate('/placement')}
                    className={`transition-colors ${location.pathname.startsWith('/placement')
                        ? 'text-amber-900 font-bold'
                        : 'text-stone-600 hover:text-amber-900'
                      }`}
                  >
                    Placement
                  </button>

                  {/* 4. Dashboard */}
                  <button
                    onClick={() => navigate('/dashboard')}
                    className={`transition-colors ${location.pathname === '/dashboard'
                        ? 'text-amber-900 font-bold'
                        : 'text-stone-600 hover:text-amber-900'
                      }`}
                  >
                    Dashboard
                  </button>
                </div>
              )}
            </div>

            {/* Right Group: User Profile & Actions */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-900 to-amber-700 flex items-center justify-center text-xs font-semibold text-white shadow-sm">
                      {user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className="text-xs text-stone-700 font-bold">
                      {user?.name}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-full border border-stone-300 text-stone-600 text-xs font-semibold hover:bg-stone-100 hover:border-amber-900/30 hover:text-amber-900 transition-all duration-300 shadow-sm"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-xs font-bold text-stone-700 hover:text-amber-900 transition-colors px-2 py-1"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="btn-primary rounded-full px-5 py-2 text-xs font-bold shadow-md shadow-amber-900/20"
                  >
                    Get Started Free
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Attempt Mock Modal */}
      {showMockModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowMockModal(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="glass-card relative w-full max-w-md p-6 md:p-8 page-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowMockModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-850 transition-all"
            >
              ✕
            </button>

            <h2 className="text-lg font-bold text-stone-900 mb-2">Attempt Mock Interview</h2>
            <p className="text-sm text-stone-500 mb-6">
              10 balanced questions • 45-minute timer • AI-graded scorecard
            </p>

            <label className="block text-sm font-medium text-stone-700 mb-2">
              Select Target Role
            </label>
            <select
              value={mockRole}
              onChange={(e) => setMockRole(e.target.value)}
              className="input-field w-full text-sm py-2.5 px-3 cursor-pointer mb-6 animate-none"
            >
              <option value="" className="bg-white text-stone-700">
                Choose a role...
              </option>
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
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto"
          onClick={() => setActiveSessionPrompt(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="glass-card relative w-full max-w-md p-6 md:p-8 page-enter"
            onClick={(e) => e.stopPropagation()}
          >
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
    </>
  );
}
