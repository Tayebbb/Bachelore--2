import React from 'react'
import { Link } from 'react-router-dom'
import { isAuthed } from '../lib/auth'

export default function FeatureCard({ feature }){
  if(!feature) return null
  const key = feature.key || feature.k || feature.id || feature.name
  const title = feature.title || feature.name || ''
  const text = feature.text || feature.description || ''
  const icon = feature.icon || 'grid'

  const authed = isAuthed()
  const dest = authed ? `/${key}` : '/login'

  return (
    <Link to={dest} className="text-decoration-none">
      <div className={`feature-card p-3 gradient-card text-dark ${authed ? '' : 'locked'}`}>
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center">
            <i className={`bi-${icon} fs-3 text-primary`} aria-hidden="true" />
            {String(key) === 'maids' && (
              <span className="badge bg-white text-primary ms-2" title="cleaning"><i className="bi-bucket"/></span>
            )}
          </div>
          <div>
            <h6 className="mb-0">
              {title}
              {!authed && <i className="bi-lock-fill ms-2 muted small" title="Login required" aria-hidden="true" />}
            </h6>
            <p className="muted small mb-0">{text}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

