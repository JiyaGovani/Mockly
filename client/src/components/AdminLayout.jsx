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
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-stone-200 sticky top-0 h-screen bg-white/80 backdrop-blur-sm">
        {/* Brand */}
        <div
          className="flex items-center gap-2 px-5 py-5 cursor-pointer"
          onClick={() => navigate('/admin')}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-800 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-amber-900/20">
            M
          </div>
          <div>
            <span className="text-sm font-bold bg-gradient-to-r from-amber-900 to-amber-700 bg-clip-text text-transparent">
              Mockly
            </span>
            <span className="block text-xs text-stone-400 -mt-0.5">Admin Panel</span>
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
                    ? 'bg-amber-900/10 text-amber-900 ring-1 ring-amber-900/20'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
                }`}
              >
                <span className="text-base">{link.icon}</span>
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-stone-200 space-y-2">
          <button
            onClick={() => navigate('/questions')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all"
          >
            ← Back to App
          </button>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-800 to-amber-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-stone-700 font-medium truncate">{user?.name}</p>
              <p className="text-xs text-stone-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-1.5 rounded-lg text-xs text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all text-left"
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
