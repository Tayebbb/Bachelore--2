import React from 'react'
import { Link } from 'react-router-dom'

export default function ListingCard({ item, type }){
  if(!item) return null
  const title = item.title || item.name || item.title
  const meta = item.location || item.location || ''
  const price = item.price || item.rent || item.price

  return (
    <div className="feature-card p-3">
      <h6>{title}</h6>
      {meta && <div className="muted small">{meta}</div>}
      <div className="mt-2 d-flex justify-content-between align-items-center">
        <div className="fw-bold">{price ? `${price} Tk` : ''}</div>
        {type === 'marketplace' ? (
          <Link to={`/item/${item.id}`} className="btn btn-sm btn-outline-primary">View</Link>
        ) : (
          <Link to="#" className="btn btn-sm btn-outline-primary">View</Link>
        )}
      </div>
    </div>
  )
}
