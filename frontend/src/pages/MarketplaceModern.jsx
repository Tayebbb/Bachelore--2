import React, { useMemo, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const data = [
  { id: 'p1', title: 'Used Graphing Calculator', location: 'BUET Area', price: '3500 BDT', status: 'Pending', contact: '017XXXXXXXX' },
  { id: 'p2', title: 'Gaming Chair', location: 'Mirpur', price: '7000 BDT', status: 'Approved', contact: '018XXXXXXXX' },
  { id: 'p3', title: 'Cycle (Mountain Bike)', location: 'Banani', price: '12000 BDT', status: 'Booked', contact: '019XXXXXXXX' },
];

export default function MarketplaceModern() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = data.filter((item) => {
      const matchesQ = !q || `${item.title} ${item.location} ${item.contact}`.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || item.status.toLowerCase().includes(filter);
      return matchesQ && matchesFilter;
    });
    return rows;
  }, [search, filter]);

  return (
    <AppShell>
      <section className="surface-card">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12 }}>
          <input
            className="app-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items, location, or seller"
          />
          <select className="app-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="calculator">Calculator</option>
            <option value="furniture">Furniture</option>
            <option value="transport">Transport</option>
          </select>
          <button className="btn-primary" type="button" onClick={() => setShowModal(true)}>Sell Item</button>
        </div>
      </section>

      <section className="bento-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {items.map((item) => {
          const isSold = item.status.toLowerCase().includes('booked') || item.status.toLowerCase().includes('sold');
          return (
            <article key={item.id} className="feature-card reveal-on-scroll">
              <div
                style={{
                  position: 'relative',
                  height: 160,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)',
                  display: 'grid',
                  placeItems: 'center',
                  border: '1px solid var(--border)',
                  marginBottom: 12,
                }}
              >
                <i className="bi bi-box" style={{ fontSize: '2rem', color: 'var(--fg-muted)' }} />
                {isSold && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.5)',
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--bg-primary)',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Sold
                    </span>
                  </div>
                )}
              </div>

              <div className="text-label">Campus Goods</div>
              <h4>{item.title}</h4>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--accent)', fontWeight: 700 }}>
                {item.price}
              </div>
              <p style={{ color: 'var(--fg-muted)' }}>Seller: {item.contact} - {item.location}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusBadge status={isSold ? 'sold' : 'available'} />
                <span className="text-label">{isSold ? 'Sold' : 'Available'}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button className="btn-primary" type="button" disabled={isSold}>Contact</button>
                <button className="btn-ghost" type="button">Details</button>
              </div>
            </article>
          );
        })}
      </section>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">List Marketplace Item</h5>
            </div>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="app-input" placeholder="Item title" />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="app-select">
                <option>Electronics</option>
                <option>Furniture</option>
                <option>Books</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Price</label>
              <input className="app-input" type="number" placeholder="Price" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="app-input" rows={4} placeholder="Item description" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn-primary" type="button" onClick={() => setShowModal(false)}>List Item</button>
              <button className="btn-ghost" type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
