import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Links */}
        <div className="flex items-center gap-8">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/questions')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
              M
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Mockly
            </span>
          </div>

          {user && (
            <div className="hidden sm:flex items-center gap-4">
              <button
                onClick={() => navigate('/questions')}
                className="text-sm text-slate-400 hover:text-slate-100 font-medium transition-all duration-300"
              >
                Questions
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm text-slate-400 hover:text-slate-100 font-medium transition-all duration-300"
              >
                Dashboard
              </button>
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-semibold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <span className="text-sm text-slate-300 font-medium">
              {user?.name}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 text-xs font-medium hover:bg-white/5 hover:border-slate-500 hover:text-slate-300 transition-all duration-300"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
