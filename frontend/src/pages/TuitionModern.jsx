import React, { useMemo, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const data = [
  { id: 't1', title: 'HSC Physics Tutor', location: 'Dhanmondi', price: '8000 BDT', status: 'Pending', contact: '017XXXXXXXX' },
  { id: 't2', title: 'CSE Algorithm Mentor', location: 'Mohammadpur', price: '12000 BDT', status: 'Approved', contact: '018XXXXXXXX' },
  { id: 't3', title: 'English Language Tutor', location: 'Mirpur', price: '7000 BDT', status: 'Booked', contact: '019XXXXXXXX' },
];

export default function TuitionModern() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('latest');
  const [showModal, setShowModal] = useState(false);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = data.filter((item) => {
      const matchesQ = !q || `${item.title} ${item.location} ${item.contact}`.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || item.status.toLowerCase().includes(filter);
      return matchesQ && matchesFilter;
    });

    if (sort === 'priceAsc') rows = [...rows].sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'priceDesc') rows = [...rows].sort((a, b) => Number(b.price) - Number(a.price));
    return rows;
  }, [search, filter, sort]);

  return (
    <AppShell>
      <section className="surface-card">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12 }}>
          <input
            className="app-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject, location, or contact"
          />
          <select className="app-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="booked">Booked</option>
          </select>
          <select className="app-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="latest">Latest</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
          </select>
          <button className="btn-primary" type="button" onClick={() => setShowModal(true)}>
            Post Tuition
          </button>
        </div>
      </section>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--fg-muted)' }}>
          <i className="bi bi-journal-x" style={{ fontSize: '3rem', marginBottom: 16, display: 'block' }} />
          <h4>No tuition listings yet</h4>
          <p>Be the first to post a tuition listing in your area.</p>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)} type="button">
            Post Tuition
          </button>
        </div>
      ) : (
        <section className="bento-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {items.map((item) => (
            <article key={item.id} className="feature-card reveal-on-scroll">
              <div className="feature-card-icon">
                <i className="bi bi-journal-text" />
              </div>
              <h4>{item.title}</h4>
              <p>{item.location} - {item.price}</p>
              <StatusBadge status={item.status} />
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button className="btn-primary" type="button">Book</button>
                <button className="btn-ghost" type="button">Details</button>
              </div>
            </article>
          ))}
        </section>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">Post Tuition Listing</h5>
            </div>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input className="app-input" placeholder="Enter subject" />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="app-input" placeholder="Enter location" />
            </div>
            <div className="form-group">
              <label className="form-label">Rate</label>
              <input className="app-input" type="number" placeholder="Monthly rate" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn-primary" type="button" onClick={() => setShowModal(false)}>Post Tuition</button>
              <button className="btn-ghost" type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
