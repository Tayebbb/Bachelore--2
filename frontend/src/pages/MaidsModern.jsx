import React, { useMemo, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const data = [
  { id: 'm1', title: 'Part-time Home Cleaning', location: 'Badda', price: '300/hr', status: 'Pending', contact: '017XXXXXXXX' },
  { id: 'm2', title: 'Weekend Kitchen Support', location: 'Uttara', price: '350/hr', status: 'Approved', contact: '018XXXXXXXX' },
  { id: 'm3', title: 'Laundry + Cleaning', location: 'Dhanmondi', price: '320/hr', status: 'Booked', contact: '019XXXXXXXX' },
];

export default function MaidsModern() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [bookingOpen, setBookingOpen] = useState(false);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((item) => {
      const matchesQ = !q || `${item.title} ${item.location} ${item.contact}`.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || item.status.toLowerCase().includes(filter);
      return matchesQ && matchesFilter;
    });
  }, [search, filter]);

  const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'M';

  return (
    <AppShell>
      <section className="surface-card">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12 }}>
          <input
            className="app-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by service, area, or contact"
          />
          <select className="app-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Areas</option>
            <option value="badda">Badda</option>
            <option value="uttara">Uttara</option>
            <option value="dhanmondi">Dhanmondi</option>
          </select>
          <button className="btn-primary" type="button" onClick={() => setBookingOpen(true)}>Request Maid</button>
        </div>
      </section>

      <section className="bento-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {items.map((item) => (
          <article key={item.id} className="surface-card reveal-on-scroll">
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: '2px solid var(--accent)',
                background: 'var(--bg-elevated)',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              {getInitials(item.title)}
            </div>
            <h4>{item.title}</h4>
            <div className="text-label">Home Care Specialist</div>
            <p style={{ color: 'var(--fg-muted)', marginTop: 8 }}>{item.location} - {item.price}</p>
            <StatusBadge status={item.status} />
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn-primary" type="button" onClick={() => setBookingOpen(true)}>Book</button>
              <button className="btn-ghost" type="button">Profile</button>
            </div>
          </article>
        ))}
      </section>

      {bookingOpen && (
        <div className="modal-overlay" onClick={() => setBookingOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">Book Maid Service</h5>
            </div>
            <div className="form-group">
              <label className="form-label">Service Date</label>
              <input className="app-input" type="date" />
            </div>
            <div className="form-group">
              <label className="form-label">Service Type</label>
              <select className="app-select">
                <option>Cleaning</option>
                <option>Cooking</option>
                <option>Laundry</option>
                <option>Full Service</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="app-input" rows={4} placeholder="Additional details" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn-primary" type="button" onClick={() => setBookingOpen(false)}>Confirm Booking</button>
              <button className="btn-ghost" type="button" onClick={() => setBookingOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
