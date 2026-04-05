import React, { useMemo, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const data = [
  { id: 'h1', title: '2 Bed Flat Near Campus', location: 'Mohammadpur', price: '15000 BDT', status: 'Approved', contact: '017XXXXXXXX' },
  { id: 'h2', title: 'Studio for Single Student', location: 'Uttara', price: '9500 BDT', status: 'Pending', contact: '018XXXXXXXX' },
  { id: 'h3', title: 'Shared Flat (3 Students)', location: 'Dhanmondi', price: '18000 BDT', status: 'Booked', contact: '019XXXXXXXX' },
];

export default function HouseRentModern() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('latest');
  const [showModal, setShowModal] = useState(false);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((item) => {
      const matchesQ = !q || `${item.title} ${item.location} ${item.contact}`.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || item.status.toLowerCase().includes(filter);
      return matchesQ && matchesFilter;
    });
  }, [search, filter]);

  const getStats = (row) => {
    if (row.id === 'h1') return { area: 1050, beds: 2, baths: 2 };
    if (row.id === 'h2') return { area: 540, beds: 1, baths: 1 };
    return { area: 1300, beds: 3, baths: 2 };
  };

  return (
    <AppShell>
      <section className="surface-card">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12 }}>
          <input
            className="app-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search property, location, or contact"
          />
          <select className="app-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Locations</option>
            <option value="mohammadpur">Mohammadpur</option>
            <option value="uttara">Uttara</option>
            <option value="dhanmondi">Dhanmondi</option>
          </select>
          <select className="app-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="latest">Rent Range</option>
            <option value="priceAsc">Low to High</option>
            <option value="priceDesc">High to Low</option>
          </select>
          <button className="btn-primary" type="button" onClick={() => setShowModal(true)}>Post Property</button>
        </div>
      </section>

      <section className="bento-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {items.map((item) => {
          const stats = getStats(item);
          return (
            <article key={item.id} className="surface-card reveal-on-scroll">
              <div
                style={{
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  height: 180,
                  background: 'var(--bg-elevated)',
                  overflow: 'hidden',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <i className="bi bi-building" style={{ fontSize: '2rem', color: 'var(--fg-muted)' }} />
              </div>

              <h4 style={{ marginTop: 16 }}>{item.title}</h4>
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
                  {item.price.split(' ')[0]} BDT
                </span>
                <span style={{ color: 'var(--fg-muted)', marginLeft: 6 }}>/month</span>
              </div>

              <div style={{ display: 'flex', gap: 16, color: 'var(--fg-muted)', fontSize: '0.875rem', margin: '12px 0' }}>
                <span><i className="bi bi-rulers me-1" />{stats.area} sqft</span>
                <span><i className="bi bi-door-open me-1" />{stats.beds} beds</span>
                <span><i className="bi bi-droplet me-1" />{stats.baths} baths</span>
              </div>

              <StatusBadge status={item.status} />
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button className="btn-primary" type="button">Apply</button>
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
              <h5 className="modal-title">Post Rental Property</h5>
            </div>
            <div className="form-group">
              <label className="form-label">Property Title</label>
              <input className="app-input" placeholder="Property title" />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="app-input" placeholder="Location" />
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Rent</label>
              <input className="app-input" type="number" placeholder="Rent amount" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn-primary" type="button" onClick={() => setShowModal(false)}>Post Property</button>
              <button className="btn-ghost" type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
