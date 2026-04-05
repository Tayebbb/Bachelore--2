import React, { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import api from '../components/axios.jsx';
import { getUser } from '../lib/auth';

export default function MaidsModern() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ availability: '', location: '', salary: '' });

  const loadRows = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/maids');
      setRows(Array.isArray(data) ? data : []);
      setError('');
    } catch {
      setRows([]);
      setError('Failed to load maid services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((item) => {
      const name = item.name || item.availability || '';
      const location = item.location || '';
      const matchesQ = !q || `${name} ${location}`.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || location.toLowerCase().includes(filter);
      return matchesQ && matchesFilter;
    });
  }, [rows, search, filter]);

  const submitMaid = async () => {
    const user = getUser();
    try {
      await api.post('/api/maids', {
        userId: user?.id || user?._id,
        availability: form.availability,
        location: form.location,
        salary: Number(form.salary || 0),
      });
      setForm({ availability: '', location: '', salary: '' });
      setBookingOpen(false);
      await loadRows();
    } catch {
      setError('Failed to create maid listing.');
    }
  };

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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--fg-muted)' }}>Loading maid services...</div>
      ) : (
      <section className="bento-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {items.map((item) => (
          <article key={item._id || item.maid_id} className="surface-card reveal-on-scroll">
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
              {getInitials(item.name || item.availability)}
            </div>
            <h4>{item.name || item.availability}</h4>
            <div className="text-label">Home Care Specialist</div>
            <p style={{ color: 'var(--fg-muted)', marginTop: 8 }}>{item.location} - {Number(item.salary || item.hourlyRate || 0).toLocaleString()} BDT/hr</p>
            <StatusBadge status={item.availability || 'available'} />
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn-primary" type="button" onClick={() => setBookingOpen(true)}>Book</button>
              <button className="btn-ghost" type="button">Profile</button>
            </div>
          </article>
        ))}
      </section>
      )}
      {error && <div style={{ color: 'var(--danger)', marginTop: 8 }}>{error}</div>}

      {bookingOpen && (
        <div className="modal-overlay" onClick={() => setBookingOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">Book Maid Service</h5>
            </div>
            <div className="form-group">
              <label className="form-label">Service Name</label>
              <input className="app-input" value={form.availability} onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))} placeholder="e.g., Weekend Support" />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="app-input" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Area" />
            </div>
            <div className="form-group">
              <label className="form-label">Hourly Rate</label>
              <input className="app-input" type="number" value={form.salary} onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))} placeholder="Rate" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn-primary" type="button" onClick={submitMaid}>Confirm</button>
              <button className="btn-ghost" type="button" onClick={() => setBookingOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
