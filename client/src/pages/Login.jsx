import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Login form state
  const [form, setForm] = useState({ email: '', password: '' });

  // Forgot password form state
  const [resetForm, setResetForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleLoginChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleResetChange = (e) => {
    setResetForm({ ...resetForm, [e.target.name]: e.target.value });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const toggleMode = (forgot) => {
    setIsForgotPassword(forgot);
    setError('');
    setSuccess('');
  };

  const validateReset = () => {
    if (!resetForm.email || !resetForm.password || !resetForm.confirmPassword) {
      return 'Please fill in all fields';
    }
    if (!/^\S+@\S+\.\S+$/.test(resetForm.email)) {
      return 'Please enter a valid email address';
    }
    if (resetForm.password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (resetForm.password !== resetForm.confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      triggerShake();
      return;
    }

    setSubmitting(true);
    try {
      const data = await login({ email: form.email, password: form.password });
      if (data?.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/questions', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed');
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateReset();
    if (validationError) {
      setError(validationError);
      triggerShake();
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({
        email: resetForm.email,
        password: resetForm.password,
      });
      setForm((prev) => ({ ...prev, email: resetForm.email, password: '' }));
      setIsForgotPassword(false);
      setSuccess('Password reset successfully! You can now log in with your new password.');
      setResetForm({ email: '', password: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message || 'Password reset failed');
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div
        className={`glass-card w-full max-w-md p-8 md:p-10 page-enter ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-900 to-amber-700 bg-clip-text text-transparent">
            {isForgotPassword ? 'Reset Password' : 'Welcome Back'}
          </h1>
          <p className="text-stone-500 mt-2 text-sm">
            {isForgotPassword
              ? 'Enter your account details to reset your password'
              : 'Sign in to continue your interview prep'}
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

        {/* Success banner */}
        {success && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-sm flex items-center gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {success}
          </div>
        )}

        {/* Login Form */}
        {!isForgotPassword ? (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-stone-600 mb-1.5"
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
                onChange={handleLoginChange}
                className={`input-field ${error ? 'error' : ''}`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-stone-600"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => toggleMode(true)}
                  className="text-xs link-accent font-medium hover:underline focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleLoginChange}
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
        ) : (
          /* Forgot Password Form */
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="reset-email"
                className="block text-sm font-medium text-stone-600 mb-1.5"
              >
                Email
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={resetForm.email}
                onChange={handleResetChange}
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="reset-password"
                className="block text-sm font-medium text-stone-600 mb-1.5"
              >
                New Password
              </label>
              <input
                id="reset-password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Min 6 characters"
                value={resetForm.password}
                onChange={handleResetChange}
                className="input-field"
              />
            </div>

            <div>
              <label
                htmlFor="reset-confirm"
                className="block text-sm font-medium text-stone-600 mb-1.5"
              >
                Confirm Password
              </label>
              <input
                id="reset-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={resetForm.confirmPassword}
                onChange={handleResetChange}
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base mt-2"
            >
              {submitting ? (
                <>
                  <span className="spinner" /> Resetting password…
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        {/* Footer link */}
        <p className="text-center text-sm text-stone-500 mt-6">
          {isForgotPassword ? (
            <>
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => toggleMode(false)}
                className="link-accent font-medium hover:underline focus:outline-none"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <Link to="/register" className="link-accent">
                Create one
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
