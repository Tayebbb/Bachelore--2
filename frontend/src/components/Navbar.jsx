import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation, NavLink } from 'react-router-dom'
import { isAuthed, logout as authLogout, onAuthChange, offAuthChange } from '../lib/auth'

export default function Navbar(){
  const navRef = useRef(null)
  const [authed, setAuthed] = useState(()=> isAuthed())
  const [menuOpen, setMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light'
    } catch (_) {
      return 'light'
    }
  })
  const navigate = useNavigate()
  const location = useLocation()

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    try {
      localStorage.setItem('theme', nextTheme)
    } catch (_) {}
  }

  const handleLogout = () => {
    authLogout()
    setAuthed(false)
    navigate('/')
  }

  useEffect(()=>{
    const el = navRef.current
    if(el){
      const onScroll = () => {
        setIsScrolled(window.scrollY > 10)
      }
      window.addEventListener('scroll', onScroll, {passive:true})
      return ()=> window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(()=>{
    const onChange = ()=> setAuthed(isAuthed())
    onAuthChange(onChange)
    return ()=> offAuthChange(onChange)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Don't show navbar on auth pages
  if (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/admin-login') {
    return null
  }

  const navLinks = [
    { to: '/home', label: 'Dashboard' },
    { to: '/roommates', label: 'Roommates' },
    { to: '/maids', label: 'Maids' },
    { to: '/tuition', label: 'Tuition' },
    { to: '/houserent', label: 'House Rent' },
    { to: '/marketplace', label: 'Marketplace' },
  ]

  return (
    <nav ref={navRef} className={`top-nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="nav-inner">
          {/* Brand */}
          <Link to={isAuthed() ? '/home' : '/'} className="nav-brand">
            <span className="brand-mark">BL</span>
            <span>BacheLORE</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="nav-links d-none d-lg-flex">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Right Actions */}
          <div className="nav-actions">
            {/* Theme Toggle */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              type="button"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <i className={`bi ${theme === 'light' ? 'bi-moon-stars' : 'bi-sun-fill'}`} />
            </button>

            {/* Auth Buttons */}
            <div className="d-none d-sm-flex" style={{ gap: 12 }}>
              {(!authed || location.pathname === '/') ? (
                <>
                  <Link to="/login" className="btn-ghost">
                    Log in
                  </Link>
                  <Link to="/signup" className="btn-primary">
                    Get Started
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/profile" className="btn-ghost">
                    <i className="bi bi-person" style={{ marginRight: 6 }} />
                    Profile
                  </Link>
                  <button
                    className="btn-ghost"
                    onClick={handleLogout}
                    style={{ color: 'var(--danger)' }}
                  >
                    <i className="bi bi-box-arrow-right" style={{ marginRight: 6 }} />
                    Logout
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="theme-toggle d-lg-none"
              onClick={() => setMenuOpen(!menuOpen)}
              type="button"
              aria-label="Toggle menu"
            >
              <i className={`bi ${menuOpen ? 'bi-x-lg' : 'bi-list'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          className="d-lg-none"
          style={{
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border)',
            padding: '16px 24px',
            animation: 'slideDown 0.3s ease',
          }}
        >
          {navLinks.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `
                d-flex align-items-center gap-3 py-3
                ${isActive ? 'text-primary' : 'text-muted'}
              `}
              style={{
                textDecoration: 'none',
                borderBottom: index < navLinks.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              {item.label}
            </NavLink>
          ))}

          {/* Mobile Auth Buttons */}
          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            {(!authed || location.pathname === '/') ? (
              <>
                <Link to="/login" className="btn-ghost flex-1" onClick={() => setMenuOpen(false)}>
                  Log in
                </Link>
                <Link to="/signup" className="btn-primary flex-1" onClick={() => setMenuOpen(false)}>
                  Get Started
                </Link>
              </>
            ) : (
              <button
                className="btn-ghost w-100"
                onClick={() => {
                  setMenuOpen(false)
                  handleLogout()
                }}
                style={{ color: 'var(--danger)' }}
              >
                <i className="bi bi-box-arrow-right" style={{ marginRight: 6 }} />
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
