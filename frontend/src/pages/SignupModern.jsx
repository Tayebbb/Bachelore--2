import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function SignupModern() {
  const navigate = useNavigate();

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h3 className="mb-1">Create Account</h3>
        <p className="text-secondary">Join the BacheLORE community.</p>
        <div className="d-grid gap-3">
          <input className="app-input" placeholder="Full Name" />
          <input className="app-input" placeholder="University Email" />
          <input className="app-input" placeholder="Phone" />
          <input className="app-input" type="password" placeholder="Password" />
          <button className="btn-gradient" onClick={() => navigate('/home')} type="button">
            Sign Up
          </button>
        </div>
        <div className="mt-3">
          <Link to="/login">Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
}
