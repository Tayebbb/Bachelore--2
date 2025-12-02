import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isAuthed } from '../lib/auth'

export default function Subscribe(){
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bkash, setBkash] = useState('')
  const [reference, setReference] = useState('')
  const [status, setStatus] = useState('idle')

  const features = [
    'Unlimited access to all features',
    'Priority support',
    'Access to premium tutors and marketplace filters',
    'No ads and early access to new tools'
  ]

  return (
    <main className="container-fluid py-5 subscribe-page">
      <div className="row justify-content-center">
        <div className="col-12">
          <div className="auth-card p-4 mx-auto" style={{maxWidth: '1100px'}}>
                <div className="row g-4">
              <div className="col-12 col-lg-5">
                <h3>Subscribe to BacheLORE Premium</h3>
                <p className="muted">Choose the plan that fits you. The subscription unlocks premium features listed below.</p>

                <ul className="mb-3">
                  {features.map((f,i)=> <li key={i}>{f}</li>)}
                </ul>
              </div>

              <div className="col-12 col-lg-7">
                <form onSubmit={async (e)=>{
                  e.preventDefault()
                  setStatus('loading')
                  // mock verification delay
                  await new Promise(r=>setTimeout(r,900))
                  setStatus('success')
                }}>
                  <div className="mb-2">
                    <label className="form-label">Full name</label>
                    <input className="form-control" value={name} onChange={e=>setName(e.target.value)} required />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Email</label>
                    <input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">bKash number</label>
                    <input className="form-control" placeholder="017XXXXXXXX" value={bkash} onChange={e=>setBkash(e.target.value)} required />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Reference number</label>
                    <input className="form-control" placeholder="e.g. TXN12345678" value={reference} onChange={e=>setReference(e.target.value)} required />
                    <div className="form-text">Please transfer 99 Tk to our bKash number and enter the transaction reference here. We'll verify and activate your subscription.</div>
                  </div>

                  <div className="d-flex align-items-center gap-3 mt-3">
                    <button className="btn hero-cta px-4 py-2" type="submit">{status==='loading' ? 'Processing...' : 'Activate Subscription'}</button>
                    <button type="button" className="btn btn-outline-secondary" onClick={(e)=>{
                      e.preventDefault()
                      // try to go back; if there is no meaningful history, fall back to home or public root
                      if(window.history.length > 1){
                        navigate(-1)
                      } else {
                        navigate(isAuthed() ? '/home' : '/')
                      }
                    }}>Cancel</button>
                  </div>

                  {status === 'success' && (
                    <div className="alert alert-success mt-3">Thanks — subscription active (mock)</div>
                  )}
                </form>
              </div>
            </div>

            {/* price shown bottom-left of the card on wide screens */}
            <div className="subscribe-price">
              <div className="fw-bold mb-1">Price</div>
              <div className="h3">99 Tk / month</div>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
