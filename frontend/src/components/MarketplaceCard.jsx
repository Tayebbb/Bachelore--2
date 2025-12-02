import React from 'react';

export default function MarketplaceCard({ item, onBuy, isOwn }) {
  return (
    <div className={`card mb-3 shadow-sm ${item.status === 'sold' ? 'bg-light' : ''}`} style={{ minHeight: 180 }}>
      {item.image && <img src={item.image} alt={item.title} className="card-img-top" style={{ maxHeight: 180, objectFit: 'cover' }} />}
      <div className="card-body">
        <h5 className="card-title">{item.title}</h5>
        <div className="mb-2 text-muted">{item.description}</div>
        <div className="mb-2"><strong>Price:</strong> {item.price} Tk</div>
        <div className="mb-2"><strong>Status:</strong> {item.status === 'sold' ? 'Sold' : 'Available'}</div>
        <div className="mb-2"><strong>Contact:</strong> {item.contact}</div>
        {!isOwn && item.status !== 'sold' && (
          <button className="btn btn-success btn-sm" onClick={onBuy}>Buy</button>
        )}
        {isOwn && <div className="badge bg-info">Your listing</div>}
      </div>
    </div>
  );
}
