

import React, { useState } from "react";
import { useNavigate } from 'react-router-dom'
import Navbar from "./Navbar";
import bg1image from "../assets/bg1image.jpg";
import "../App.css";
import AuthCard from './AuthCard'
import axios from './axios'
import { login as authLogin } from '../lib/auth'

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("")
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true)
    try {
      const { data } = await axios.post('/api/login', { email, password })
      if (data && data.user) {
        // store auth flag / user and navigate
  try { authLogin(data.user) } catch(e){}
        console.log('Logged in user:', data.user)
        setEmail('')
        setPassword('')
        navigate('/home')
      } else {
        setError((data && data.msg) || 'Invalid credentials')
      }
    } catch (err) {
      console.error('Login error:', err)
      const msg = err?.response?.data?.msg || err?.response?.data?.error || err.message || 'Server error, try again later.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <img src={bg1image} alt="Background" className="background-image" />
      <div className="app-container">
        <Navbar />
        <AuthCard title="Login">
          <form className="auth-form" onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 340, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input signup-gradient-input auth-input-styled"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input signup-gradient-input auth-input-styled"
              />
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" className="auth-btn signup-gradient-btn auth-submit-btn">Login</button>
            </form>
        </AuthCard>
      </div>
    </>
  );
};

export default Login;
