import React from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h3 className="mb-1">Recover Password</h3>
        <p className="text-secondary">Email-ready architecture: this page can trigger reset email service hooks.</p>
        <div className="d-grid gap-3">
          <input className="app-input" type="email" placeholder="Registered email" />
          <button className="btn-gradient" type="button">Send Reset Link</button>
        </div>
        <div className="mt-3">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
