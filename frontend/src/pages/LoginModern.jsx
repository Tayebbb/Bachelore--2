import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginModern() {
  const navigate = useNavigate();

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h3 className="mb-1">Welcome Back</h3>
        <p className="text-secondary">Sign in to continue managing your bachelor life.</p>
        <div className="d-grid gap-3">
          <input className="app-input" type="email" placeholder="Email" />
          <input className="app-input" type="password" placeholder="Password" />
          <button className="btn-gradient" onClick={() => navigate('/home')} type="button">
            Login
          </button>
        </div>
        <div className="d-flex justify-content-between mt-3">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/signup">Create account</Link>
        </div>
      </div>
    </div>
  );
}
