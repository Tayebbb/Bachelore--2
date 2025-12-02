import React from 'react'
import { BRAND } from '../assets/brand'

export default function Footer() {
  return (
    <footer style={{
      background: 'rgba(18,44,74,0.85)',
      color: '#fff',
      borderTop: '1px solid rgba(0,0,0,0.06)',
      boxShadow: '0 -2px 16px 0 rgba(10,31,68,0.08)',
      padding: '2rem 0 1.2rem 0',
      marginTop: '0',
      width: '100%',
      textAlign: 'center',
      fontWeight: 500,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)'
    }}>
      <div style={{fontSize:'1.2rem', fontWeight:700, letterSpacing:'0.04em', marginBottom:4, display:'flex', alignItems:'center', justifyContent:'center', gap:8}}>
        <img src="/logo.png" alt="BacheLORE" width={32} height={32} style={{objectFit:'contain', borderRadius:8, boxShadow:'0 2px 8px rgba(0,184,217,0.10)'}} />
        BacheLORE
      </div>
      <div style={{fontSize:'1rem', opacity:0.85, marginBottom:2}}>For the Lore</div>
      <div style={{fontSize:'0.95rem', opacity:0.7}}>© {new Date().getFullYear()} BacheLORE. All rights reserved.</div>
    </footer>
  );
}
