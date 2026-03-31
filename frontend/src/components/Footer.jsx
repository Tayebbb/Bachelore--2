import React from 'react'

export default function Footer() {
  return (
    <footer className="site-footer text-center">
      <div className="site-footer-title">
        <img src="/logo.png" alt="BacheLORE" width={32} height={32} className="brand-logo-img" />
        BacheLORE
      </div>
      <div className="site-footer-sub">For the Lore</div>
      <div className="site-footer-sub">© {new Date().getFullYear()} BacheLORE. All rights reserved.</div>
    </footer>
  );
}
