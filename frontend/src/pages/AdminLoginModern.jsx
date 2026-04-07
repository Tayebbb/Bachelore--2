import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../components/axios';
import { adminLogin, isAdminAuthed } from '../lib/auth';

export default function AdminLoginModern() {
  const navigate = useNavigate();
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdminAuthed()) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (adminCode.length < 4) {
      setError('Please enter a valid admin code');
      return;
    }

    try {
      const { data } = await axios.post('/api/admin/login', { adminCode });
      adminLogin({ name: 'Admin', role: 'admin' }, data?.token);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.msg || 'Invalid admin code');
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
              background: 'var(--danger)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
              fontWeight: 800,
              fontSize: '1.25rem',
            }}
          >
            <i className="bi bi-shield-lock" />
          </div>
          <h1 className="auth-card-title">Admin Access</h1>
          <p className="auth-card-subtitle">
            Secure moderation center for administrators
          </p>
        </div>

        {/* Security Notice */}
        <div
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <i className="bi bi-info-circle" style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--fg-muted)' }}>
            This area is restricted to authorized personnel only.
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin Code</label>
            <input
              className="app-input"
              type="password"
              placeholder="Enter secure admin code"
              value={adminCode}
              onChange={(e) => {
                setAdminCode(e.target.value);
                setError('');
              }}
              style={{
                borderColor: error ? 'var(--danger)' : undefined,
                borderLeft: error ? '3px solid var(--danger)' : undefined,
              }}
            />
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 8,
                  fontSize: '0.875rem',
                  color: 'var(--danger)',
                }}
              >
                <i className="bi bi-exclamation-circle" />
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            style={{
              marginTop: 8,
              background: 'var(--danger)',
            }}
          >
            <i className="bi bi-shield-check" />
            Login as Admin
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link
            to="/"
            style={{
              color: 'var(--fg-muted)',
              fontSize: '0.9375rem',
            }}
          >
            <i className="bi bi-arrow-left me-2" />
            Back to main site
          </Link>
        </div>
      </div>
    </div>
  );
}
