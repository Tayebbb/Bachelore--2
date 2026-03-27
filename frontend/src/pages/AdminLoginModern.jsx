import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLoginModern() {
  const navigate = useNavigate();

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h3 className="mb-1">Admin Access</h3>
        <p className="text-secondary">Use secure admin code to enter moderation center.</p>
        <div className="d-grid gap-3">
          <input className="app-input" placeholder="Admin Code" type="password" />
          <button className="btn-gradient" onClick={() => navigate('/admin-dashboard')} type="button">
            Login as Admin
          </button>
        </div>
      </div>
    </div>
  );
}
