import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { BRAND } from '../assets/brand'
import { isAuthed, logout as authLogout, onAuthChange, offAuthChange } from '../lib/auth'

export default function Navbar(){
  const navRef = useRef(null)
  const [authed, setAuthed] = useState(()=> isAuthed())
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

  return (
  <nav ref={navRef} className="navbar navbar-expand-lg sticky-top navbar-custom navbar-dark" style={{
    background: 'rgba(18,44,74,0.85)',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 2px 16px 0 rgba(10,31,68,0.08)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)'
  }}>
    <div className="container">
      <Link className="navbar-logo navbar-brand d-flex align-items-center gap-2" to={isAuthed() ? '/home' : '/'} style={{textDecoration:'none'}}>
        <img src="/logo.png" alt="BacheLORE" width={38} height={38} style={{objectFit:'contain', borderRadius:10, boxShadow:'0 2px 8px rgba(0,184,217,0.10)'}} />
        <span style={{fontWeight:700, color:'var(--bachelore-cyan)', fontSize:'1.5rem', letterSpacing:'0.04em'}}>BacheLORE</span>
      </Link>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
        <span className="navbar-toggler-icon" />
      </button>
      <div className="collapse navbar-collapse" id="mainNav">
        <ul className="navbar-nav ms-auto mb-2 mb-lg-0 d-flex align-items-lg-center navbar-links">
          <li className="nav-item"><Link className="nav-link" to="/roommates">Roommates</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/maids">Maids</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/tuition">Tuition</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/bills">Bills</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/marketplace">Marketplace</Link></li>
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
    </div>
  </nav>
  )
}
