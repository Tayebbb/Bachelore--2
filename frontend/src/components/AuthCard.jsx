import React from 'react'

export default function AuthCard({ children, title }){
  return (
    <div style={{ minHeight: '80vh' , display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', padding: 0, margin: 0 }}>
      <div className="card signup-gradient-card" style={{
        width: '100%',
        maxWidth: 420,
        minWidth: 0,
        padding: '2.2rem 2rem 2rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: '1.25rem',
        boxShadow: '0 16px 48px 0 rgba(0,184,217,0.25), 0 2px 8px 0 rgba(0,184,217,0.10)',
        border: 'none',
        background: 'linear-gradient(120deg, #122C4A 0%, #0A1F44 60%, #00B8D9 100%)',
        margin: '0 auto',
        transition: 'transform 0.18s'
      }}
      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.035)'}
      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
        {title && <h2 className="section-title" style={{ color: '#00B8D9', marginBottom: 8, letterSpacing: '0.04em', fontWeight: 700, fontSize: '2rem' }}>{title}</h2>}
        {children}
      </div>
    </div>
  )
}
