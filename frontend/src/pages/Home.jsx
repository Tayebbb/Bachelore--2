import React, { useState, useEffect } from 'react'
import Announcements from '../components/Announcements'
import { Link } from 'react-router-dom'


import FEATURES from '../data/features'
import useCarouselAutoplay from '../hooks/useCarouselAutoplay'
import FeatureCard from '../components/FeatureCard'
import ActivityFeed from '../components/ActivityFeed.jsx';

export default function Home() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => setAnnouncements(Array.isArray(data) ? data : data.announcements || []))
      .catch(() => setAnnouncements([]))
  }, [])

  const trackRef = useCarouselAutoplay({ intervalMs: 3000, mobileThreshold: 768 })

  return (
    <main>
      <header className="container container-hero">
        <div className="row align-items-center">
          <div className="col-lg-6">
            <img src="/logo.png" alt="logo" style={{height:36}} />
            <h1 className="mt-4">BacheLORE – Your Ultimate Bachelor Life Companion</h1>
            <p className="muted">All the tools, services, and guidance you need to live smarter, easier, and better.</p>
            <div className="mt-4 d-flex gap-2">
              <Link className="btn hero-cta" to="/subscription">Get Access – 99 Tk/month</Link>
              <a className="btn hero-cta" href="#features">Explore Features</a>
            </div>
          </div>
          <div className="col-lg-6 mt-4 mt-lg-0">
            <div className="newsletter">
              <h5>Subscribe to our Newsletter</h5>
              <form className="d-flex gap-2 mt-3 align-items-center" onSubmit={async (e)=>{
                e.preventDefault()
                // simple email validation
                const re = /^\S+@\S+\.\S+$/
                if(!re.test(email)){
                  setStatus('error'); setMessage('Please enter a valid email');
                  setTimeout(()=> setStatus('idle'), 2500)
                  return
                }
                setStatus('loading')
                // mock submit
                await new Promise(r=>setTimeout(r,800))
                setStatus('success')
                setMessage('Subscribed — check your inbox for confirmation')
                setEmail('')
                setTimeout(()=> setStatus('idle'), 3000)
              }}>
                <input className="form-control form-control-sm" placeholder="example@aust.edu" value={email} onChange={e=>setEmail(e.target.value)} />
                <button type="submit" className="btn hero-cta small">{status==='loading' ? 'Saving...' : 'Subscribe'}</button>
              </form>
              {status === 'success' && (
                <div className="alert alert-success mt-2" role="alert">{message}</div>
              )}
              {status === 'error' && (
                <div className="alert alert-danger mt-2" role="alert">{message}</div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section id="features" className="container py-5">
        <div className="row g-4">
          {FEATURES.map(f=> (
            <div className="col-6 col-md-4" key={f.key}>
              <FeatureCard feature={f} />
            </div>
          ))}
        </div>
      </section>

      <section className="container py-5">
        <div className="row">
          <div className="col-lg-8">
            <h3 className="panel-title">Recent activity</h3>
            <p className="muted panel-sub">Your latest trips through the app — quick access to recent searches, bookings, and listings.</p>
            <div className="mt-3 activity-panel">
              <ActivityFeed />
            </div>
          </div>
          <div className="col-lg-4 mt-4 mt-lg-0">
            <h5 className="panel-title">Announcements</h5>
            <Announcements items={announcements} />
          </div>
        </div>
      </section>

    </main>
  )
}