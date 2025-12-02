import React, { useEffect, useState } from 'react';
import { getUser } from '../lib/auth';
import MarketplaceForm from '../components/MarketplaceForm.jsx';
import MarketplaceCard from '../components/MarketplaceCard.jsx';

export default function Marketplace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getUser();

  const fetchListings = () => {
    setLoading(true);
    fetch('/api/marketplace')
      .then(res => res.json())
      .then(data => { setListings(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError('Failed to load listings'); setLoading(false); });
  };

  useEffect(() => { fetchListings(); }, []);

  const handleBuy = async (id) => {
    if (!user || !user.email) return alert('Login required');
    const res = await fetch(`/api/marketplace/${id}/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyerEmail: user.email })
    });
    if (res.ok) fetchListings();
    else alert('Failed to buy');
  };

  return (
    <main className="container py-5">
      <h3>Marketplace</h3>
      <p className="muted">Buy and sell items locally.</p>

      <MarketplaceForm onCreated={fetchListings} />

      {loading ? <div>Loading...</div> : error ? <div className="alert alert-danger">{error}</div> : (
        <div className="row g-3">
          {listings.map(item => (
            <div className="col-md-4" key={item._id}>
              <MarketplaceCard item={item} onBuy={() => handleBuy(item._id)} isOwn={user && item.sellerEmail === user.email} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
