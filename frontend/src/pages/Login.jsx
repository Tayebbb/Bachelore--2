import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from '../components/axios'
import { login as authLogin } from '../lib/auth'

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      setStatus('idle');
      return;
    }

    try {
      const { data } = await axios.post('/api/login', { email, password })
      if (data && data.user) {
        setStatus('success')
        console.log('Logged in user:', data.user)
        try { authLogin(data.user) } catch(e){}
        const params = new URLSearchParams(location.search);
        const next = params.get('next');
        navigate(next || '/home');
      } else {
        setStatus('error')
        setError('Invalid credentials')
      }
    } catch (err) {
      console.error('Login error:', err)
      setStatus('error')
      setError(err.response?.data?.msg || 'Login failed. Please try again.')
    }
  };

  return (
    <main className="container py-5 auth-page">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card p-4 auth-card">
            <h3 className="mb-3">Welcome back</h3>
            <p className="muted">Sign in to access your dashboard and services.</p>
            <form onSubmit={submit} className="mt-3">
              <div className="mb-2">
                <label className="form-label small">Email</label>
                <input className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label small">Password</label>
                <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="d-flex gap-2 align-items-center">
                <button className="btn hero-cta" type="submit">
                  {status === 'loading' ? 'Signing in...' : 'Sign in'}
                </button>
                <Link to="/signup" className="muted small d-flex align-items-center ms-2">Don't have an account?</Link>
              </div>
              {status === 'success' && (
                <div className="alert alert-success mt-3">Login successful!</div>
              )}
              {error && (
                <div className="alert alert-danger mt-3">{error}</div>
              )}
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
