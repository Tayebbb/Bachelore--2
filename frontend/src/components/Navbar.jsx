import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { isAuthed, logout as authLogout, onAuthChange, offAuthChange } from '../lib/auth'

export default function Navbar(){
  const navRef = useRef(null)
  const [authed, setAuthed] = useState(()=> isAuthed())
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    authLogout()
    setAuthed(false)
    navigate('/')
  }

  useEffect(()=>{
    const el = navRef.current
    if(el){
      const onScroll = () => {
        if(window.scrollY > 8) el.classList.add('scrolled')
        else el.classList.remove('scrolled')
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

  return (
  <nav ref={navRef} className="navbar navbar-expand-lg sticky-top navbar-custom">
    <div className="container">
      <Link className="navbar-logo navbar-brand d-flex align-items-center gap-2" to={isAuthed() ? '/home' : '/'}>
        <img src="/logo.png" alt="BacheLORE" width={38} height={38} className="brand-logo-img" />
        <span className="brand-title">BacheLORE</span>
      </Link>

      <button
        className="navbar-toggler d-lg-none"
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-controls="mainNavMobile"
        aria-expanded={menuOpen}
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon" />
      </button>

      <div className="d-none d-lg-flex ms-auto" id="mainNavDesktop">
        <ul className="navbar-nav ms-auto mb-2 mb-lg-0 d-flex align-items-lg-center navbar-links">
          <li className="nav-item"><Link className="nav-link" to="/roommates">Roommates</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/maids">Maids</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/tuition">Tuition</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/bills">Bills</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/marketplace">Marketplace</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/subscription-payments">Payments</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/activities">Activity Log</Link></li>
          {(!authed || location.pathname === '/') ? (
            <>
              <li className="nav-item mt-2 mt-lg-0">
                <Link className="btn btn-primary btn-sm w-100 w-lg-auto text-center" to="/login">Login</Link>
              </li>
              <li className="nav-item mt-2 mt-lg-0 ms-lg-2">
                <Link className="btn btn-success btn-sm w-100 w-lg-auto text-center" to="/signup">Sign up</Link>
              </li>
            </>
          ) : (
            <li className="nav-item mt-2 mt-lg-0 ms-lg-2">
              <button className="btn btn-danger btn-sm w-100 w-lg-auto text-center" onClick={handleLogout}>Logout</button>
            </li>
          )}
        </ul>
      </div>

      <div
        id="mainNavMobile"
        className={`navbar-mobile-panel d-lg-none ${menuOpen ? 'open' : ''}`}
      >
        <ul className="navbar-nav navbar-links-mobile">
          <li className="nav-item"><Link className="nav-link" to="/roommates">Roommates</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/maids">Maids</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/tuition">Tuition</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/bills">Bills</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/marketplace">Marketplace</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/subscription-payments">Payments</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/activities">Activity Log</Link></li>
          {(!authed || location.pathname === '/') ? (
            <>
              <li className="nav-item mt-2">
                <Link className="btn btn-primary btn-sm w-100 text-center" to="/login">Login</Link>
              </li>
              <li className="nav-item mt-2">
                <Link className="btn btn-success btn-sm w-100 text-center" to="/signup">Sign up</Link>
              </li>
            </>
          ) : (
            <li className="nav-item mt-2">
              <button className="btn btn-danger btn-sm w-100 text-center" onClick={handleLogout}>Logout</button>
            </li>
          )}
        </ul>
      </div>
    </div>
  </nav>
  )
}
