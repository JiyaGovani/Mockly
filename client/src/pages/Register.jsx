import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
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

  const validate = () => {
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      return 'Please fill in all fields';
    }
    if (form.name.length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      return 'Please enter a valid email address';
    }
    if (form.password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (form.password !== form.confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      triggerShake();
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      navigate('/questions', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="bg-orb w-96 h-96 bg-violet-600 top-[-8%] right-[-5%]" />
      <div
        className="bg-orb w-80 h-80 bg-indigo-600 bottom-[-8%] left-[-5%]"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="bg-orb w-48 h-48 bg-purple-500 top-[50%] left-[15%]"
        style={{ animationDelay: '4s' }}
      />

      <div
        className={`glass-card w-full max-w-md p-8 md:p-10 page-enter ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Start your journey to interview mastery
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="reg-name"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Full Name
            </label>
            <input
              id="reg-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={form.name}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Email
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Password
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label
              htmlFor="reg-confirm"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Confirm Password
            </label>
            <input
              id="reg-confirm"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={handleChange}
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
                <span className="spinner" /> Creating account…
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer link */}
        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="link-accent">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
