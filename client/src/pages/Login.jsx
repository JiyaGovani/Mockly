import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      triggerShake();
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: form.email, password: form.password });
      navigate('/questions', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="bg-orb w-96 h-96 bg-indigo-600 top-[-10%] left-[-5%]" />
      <div
        className="bg-orb w-72 h-72 bg-violet-600 bottom-[-5%] right-[-5%]"
        style={{ animationDelay: '3s' }}
      />
      <div
        className="bg-orb w-56 h-56 bg-purple-500 top-[40%] right-[20%]"
        style={{ animationDelay: '5s' }}
      />

      <div
        className={`glass-card w-full max-w-md p-8 md:p-10 page-enter ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Sign in to continue your interview prep
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className={`input-field ${error ? 'error' : ''}`}
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className={`input-field ${error ? 'error' : ''}`}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 text-base"
          >
            {submitting ? (
              <>
                <span className="spinner" /> Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer link */}
        <p className="text-center text-sm text-slate-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="link-accent">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
