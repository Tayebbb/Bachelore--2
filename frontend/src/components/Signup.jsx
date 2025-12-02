
import React, { useState } from "react";
import Navbar from "./Navbar";
import bg1image from "../assets/bg1image.jpg";
import "../App.css";
import AuthCard from './AuthCard'
import axios from './axios'

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!fullName || !email || !password || !confirmPassword) {
    setError("Please fill in all fields.");
    setSuccess("");
    return;
  }
  if (password !== confirmPassword) {
    setError("Passwords do not match.");
    setSuccess("");
    return;
  }
  setError("");
  try {
    setLoading(true)
    setError("")
    setSuccess("")
    const { data } = await axios.post('/api/signup', { fullName, email, password })

    if (data && data.user) {
      setSuccess((data.msg || 'Signup successful') + ` (id: ${data.user.id})`)
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
    } else if (data && data.msg) {
      setSuccess(data.msg)
    } else {
      setError("Signup failed: unexpected response from server")
    }
  } catch (err) {
    console.error('Signup error:', err);
    const msg = err?.response?.data?.msg || err?.response?.data?.error || err.message || 'Server error, try again later.'
    setError(msg);
  } finally {
    setLoading(false)
  }
};

  return (
    <>
      <img src={bg1image} alt="Background" className="background-image" />
      <div className="app-container">
        <Navbar />
        <AuthCard title="Sign Up">
            <form className="auth-form" onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 340, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="auth-input signup-gradient-input auth-input-styled"
              />
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
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input signup-gradient-input auth-input-styled"
              />
              {error && <div className="auth-error">{error}</div>}
              {success && <div className="auth-success">{success}</div>}
              <button type="submit" className="auth-btn signup-gradient-btn auth-submit-btn">Sign Up</button>
            </form>
        </AuthCard>
      </div>
    </>
  );
};
export default Signup;
