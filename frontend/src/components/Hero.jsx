import React from 'react'

export default function Hero({title, subtitle, ctaText, onCta}){
  return (
    <section className="container container-hero">
      <div className="row align-items-center">
        <div className="col-lg-6">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          <div className="mt-4 d-flex gap-2">
            <button onClick={onCta} className="btn hero-cta">{ctaText}</button>
            <a className="btn btn-outline-secondary" href="#features">Explore Features</a>
          </div>
        </div>
      </div>
    </section>
  )
}
