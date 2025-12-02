import React, { useEffect, useState } from 'react'
import Announcements from '../components/Announcements'
import { Link } from 'react-router-dom'
import FEATURES from '../data/features'
import useCarouselAutoplay from '../hooks/useCarouselAutoplay'
import FeatureCard from '../components/FeatureCard'

export default function PublicHome() {
  const [announcements, setAnnouncements] = useState([])
  const trackRef = useCarouselAutoplay({ intervalMs: 3000, mobileThreshold: 768 })

  useEffect(() => {
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => setAnnouncements(Array.isArray(data) ? data : data.announcements || []))
      .catch(() => setAnnouncements([]))
  }, [])

  return (
    <main>
      <header className="container container-hero">
        <div className="row align-items-center">
          <div className="col-lg-6">
            <img src="/logo.png" alt="logo" style={{height:36}} />
            <h1 className="mt-4">BacheLORE — Simplify Bachelor Life</h1>
            <p className="muted">A single app for roommates, tuition, chores, bills and more — try the demo to see how it works.</p>

            <div className="mt-4 d-flex gap-2">
              <Link className="btn hero-cta" to="/login">Try demo</Link>
              <Link className="btn btn-ghost" to="/subscription">Get subscription</Link>
            </div>

            <div className="mt-4">
              <small className="muted">No credit card required to explore the demo. Sign in to access personalized features.</small>
            </div>
          </div>

          <div className="col-lg-6 mt-4 mt-lg-0">
              <div className="row g-3">
              {FEATURES.map(f=> (
                <div className="col-6" key={f.key}>
                  <FeatureCard feature={f} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="container py-5">
        <div className="row">
          <div className="col-lg-8">
            <h3 className="panel-title">How it works</h3>
            <ol className="muted panel-sub">
              <li>Browse the demo features on this page.</li>
              <li>Sign in to save preferences and access full tools.</li>
              <li>Subscribe to remove limits and get premium services.</li>
            </ol>
            <div className="mt-4 promo-panel">
              <h5 className="panel-title">Why BacheLORE?</h5>
              <p className="muted panel-sub">Everything a bachelor needs — trusted services, fast bookings, and local deals in one place.</p>

              <div className="row g-2 mt-3 why-cards">
                <div className="col-12 col-md-4">
                  <div className="card p-3 text-center h-100">
                    <div className="why-card-icon"><i className="bi-people-fill"/></div>
                    <div className="fw-bold mt-2">Verified community</div>
                    <div className="muted small">Profiles, reviews & safe matches</div>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="card p-3 text-center h-100">
                    <div className="why-card-icon"><i className="bi-lightning-charge-fill"/></div>
                    <div className="fw-bold mt-2">Fast bookings</div>
                    <div className="muted small">Book maids, tutors and services in minutes</div>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="card p-3 text-center h-100">
                    <div className="why-card-icon"><i className="bi-cart"/></div>
                    <div className="fw-bold mt-2">Local deals</div>
                    <div className="muted small">Buy & sell with nearby bachelors</div>
                  </div>
                </div>
              </div>

              <div className="promo-metrics">
                <div className="metric">
                  <div className="metric-value">12k+</div>
                  <div className="muted small">active users</div>
                </div>
                <div className="metric">
                  <div className="metric-value">6</div>
                  <div className="muted small">tools</div>
                </div>
                <div className="metric">
                  <div className="metric-value">4.8</div>
                  <div className="muted small">avg rating</div>
                </div>
              </div>

              <div className="d-flex gap-2 mt-3">
                <Link className="btn hero-cta" to="/subscription">Get Access — 99 Tk/month</Link>
                <Link className="btn btn-ghost" to="/login">Try demo</Link>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="gradient-card p-3 text-dark">
              <h6 className="mb-2">Quick facts</h6>
              <p className="muted small mb-1">Trusted by students and young professionals for organizing daily life.</p>
              <div className="d-flex gap-2 mt-2">
                <div className="small"><strong>6</strong><div className="muted">tools</div></div>
                <div className="small"><strong>99 Tk</strong><div className="muted">/month</div></div>
              </div>
            </div>
            <div className="mt-3">
              <h5 className="panel-title">Announcements</h5>
              <Announcements items={announcements} />
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <h3>What users say</h3>
        <div className="testimonials-static mt-3 d-flex gap-3">
          <div className="testimonial-card testimonial p-3">"Quick roommate matches — enjoyed the experience." — Ali</div>
          <div className="testimonial-card testimonial p-3">"Tutors were responsive and helpful." — Fahad</div>
          <div className="testimonial-card testimonial p-3">"Marketplace saved me money on furniture." — Nadia</div>
        </div>
      </section>
    </main>
  )
}
