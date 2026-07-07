import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Placeholder Questions page — verifies auth is working.
 * Will be fully built in plan 01-03.
 */
export default function Questions() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="bg-orb w-80 h-80 bg-indigo-600 top-[-5%] left-[10%]" />
      <div
        className="bg-orb w-64 h-64 bg-violet-600 bottom-[5%] right-[5%]"
        style={{ animationDelay: '3s' }}
      />

      <div className="glass-card w-full max-w-lg p-8 md:p-10 page-enter text-center">
        {/* Welcome header */}
        <div className="mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg shadow-indigo-500/30">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <h1 className="text-2xl font-bold text-slate-100">
            Welcome, {user?.name || 'Student'}!
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            You&apos;re signed in as{' '}
            <span className="text-indigo-400 font-medium">{user?.email}</span>
          </p>
        </div>

        {/* Placeholder message */}
        <div className="mb-8 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <p className="text-slate-300 text-sm leading-relaxed">
            🎯 The question browser is coming in the next phase. For now,
            your authentication is working perfectly!
          </p>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="px-6 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-white/5 hover:border-slate-500 transition-all duration-300 text-sm font-medium"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
