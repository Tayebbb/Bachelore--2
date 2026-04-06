import React, { useState, useEffect } from 'react';
import axios from '../components/axios';
import { Link, useNavigate } from 'react-router-dom';
import { login as authLogin } from '../lib/auth';

export default function SignupModern() {
  const navigate = useNavigate();
  const [theme] = useState(() => localStorage.getItem('theme') || 'light');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // Sync theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      navigate('/student/dashboard');
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
          <h1 className="auth-card-title">Create Account</h1>
          <p className="auth-card-subtitle">
            Join thousands managing their bachelor life
          </p>
        </div>

        {/* Progress Steps */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 32,
          }}
        >
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  background: step >= s ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: step >= s ? 'var(--bg-primary)' : 'var(--fg-muted)',
                  border: step === s ? '2px solid var(--accent)' : `1px solid var(--border)`,
                }}
              >
                {step > s ? <i className="bi bi-check" /> : s}
              </div>
              {s < 2 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: step > s ? 'var(--accent)' : 'var(--border)',
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (step === 1) {
              setStep(2);
              return;
            }

            try {
              const payload = {
                name: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
              };
              const { data } = await axios.post('/api/signup', payload);
              if (data?.user) {
                authLogin(data.user)
                navigate('/student/dashboard', { replace: true });
              }
            } catch {
              // keep the form visible; backend error handling will surface elsewhere if needed
            }
          }}
        >
          {step === 1 ? (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="app-input"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">University Email</label>
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
                <label className="form-label">Phone Number</label>
                <input
                  className="app-input"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                Continue
                <i className="bi bi-arrow-right" />
              </button>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Create Password</label>
                <input
                  className="app-input"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  className="app-input"
                  type="password"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    fontSize: '0.875rem',
                    color: 'var(--fg-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <input type="checkbox" style={{ marginTop: 2 }} required />
                  <span>
                    I agree to the{' '}
                    <a href="#" style={{ color: 'var(--accent)' }}>Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" style={{ color: 'var(--accent)' }}>Privacy Policy</a>
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                  Create Account
                  <i className="bi bi-arrow-right" />
                </button>
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <span style={{ color: 'var(--fg-muted)', fontSize: '0.9375rem' }}>
            Already have an account?{' '}
          </span>
          <Link
            to="/login"
            style={{
              color: 'var(--accent)',
              fontWeight: 600,
              fontSize: '0.9375rem',
            }}
          >
            Sign in
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
