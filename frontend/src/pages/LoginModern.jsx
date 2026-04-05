import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from '../components/axios';
import { login as authLogin } from '../lib/auth';

export default function LoginModern() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme] = useState(() => localStorage.getItem('theme') || 'light');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  // Sync theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    const email = formData.email?.trim();
    const password = formData.password;
    if (!email || !password) {
      setStatus('idle');
      setError('Please enter both email and password.');
      return;
    }

    try {
      const { data } = await axios.post('/api/login', { email, password });
      if (data && data.user) {
        authLogin(data.user);
        setStatus('success');
        const params = new URLSearchParams(location.search);
        const next = params.get('next');
        navigate(next || '/home');
      } else {
        setStatus('error');
        setError('Invalid credentials');
      }
    } catch (err) {
      setStatus('error');
      setError(err?.response?.data?.msg || err?.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-spotlight" />

      <div className="auth-card reveal" style={{ animationDelay: '0.1s' }}>
        {/* Header */}
        <div className="auth-card-header">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent)',
              color: 'var(--bg-primary)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
              fontWeight: 800,
              fontSize: '1.25rem',
            }}
          >
            BL
          </div>
          <h1 className="auth-card-title">Welcome back</h1>
          <p className="auth-card-subtitle">
            Sign in to continue managing your bachelor life
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="app-input"
              type="email"
              placeholder="you@university.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <Link
                to="/forgot-password"
                style={{ fontSize: '0.875rem', color: 'var(--accent)' }}
              >
                Forgot?
              </Link>
            </div>
            <input
              className="app-input"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            style={{ marginTop: 8 }}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Signing In...' : 'Sign In'}
            <i className="bi bi-arrow-right" />
          </button>
          {error && (
            <div
              style={{
                marginTop: 12,
                color: 'var(--danger)',
                fontSize: '0.9rem',
              }}
            >
              {error}
            </div>
          )}
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            margin: '24px 0',
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--fg-muted)' }}>Or continue with</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Social Login */}
        <div style={{ display: 'flex', gap: 12 }}>
          {['google', 'github', 'linkedin'].map((provider) => (
            <button
              key={provider}
              type="button"
              className="btn-ghost"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <i className={`bi bi-${provider}`} />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <span style={{ color: 'var(--fg-muted)', fontSize: '0.9375rem' }}>
            Don't have an account?{' '}
          </span>
          <Link
            to="/signup"
            style={{
              color: 'var(--accent)',
              fontWeight: 600,
              fontSize: '0.9375rem',
            }}
          >
            Create one
          </Link>
        </div>
      </div>

      {/* Back to home link */}
      <Link
        to="/"
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--fg-muted)',
          fontSize: '0.9375rem',
          fontWeight: 500,
        }}
      >
        <i className="bi bi-arrow-left" />
        Back to home
      </Link>
    </div>
  );
}
