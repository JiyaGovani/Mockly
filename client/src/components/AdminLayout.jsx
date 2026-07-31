import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { path: '/admin', label: 'Dashboard', icon: '📊', id: 'nav-admin-dashboard' },
  { path: '/admin/questions', label: 'Questions', icon: '❓', id: 'nav-admin-questions' },
  { path: '/admin/roles', label: 'Roles', icon: '🏷️', id: 'nav-admin-roles' },
  { path: '/admin/users', label: 'Users', icon: '👥', id: 'nav-admin-users' },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-white/5 sticky top-0 h-screen">
        {/* Brand */}
        <div
          className="flex items-center gap-2 px-5 py-5 cursor-pointer"
          onClick={() => navigate('/admin')}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
            M
          </div>
          <div>
            <span className="text-sm font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Mockly
            </span>
            <span className="block text-xs text-slate-500 -mt-0.5">Admin Panel</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(link.path);
            return (
              <button
                key={link.path}
                id={link.id}
                onClick={() => navigate(link.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/30'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span className="text-base">{link.icon}</span>
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/5 space-y-2">
          <button
            onClick={() => navigate('/questions')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
          >
            ← Back to App
          </button>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-semibold text-white shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-300 font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-600 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all text-left"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
