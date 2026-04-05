import React, { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import api from '../components/axios.jsx';
import { getUser } from '../lib/auth';

export default function HouseRentModern() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('latest');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ location: '', rent: '', rooms: '', description: '' });

  const loadRows = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/house-rent');
      setRows(Array.isArray(data) ? data : []);
      setError('');
    } catch {
      setRows([]);
      setError('Failed to load house rent listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filtered = rows.filter((item) => {
      const title = item.title || item.location || '';
      const location = item.location || '';
      const matchesQ = !q || `${title} ${location}`.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || location.toLowerCase().includes(filter);
      return matchesQ && matchesFilter;
    });

    if (sort === 'priceAsc') filtered = [...filtered].sort((a, b) => Number(a.rent || a.price || 0) - Number(b.rent || b.price || 0));
    if (sort === 'priceDesc') filtered = [...filtered].sort((a, b) => Number(b.rent || b.price || 0) - Number(a.rent || a.price || 0));
    return filtered;
  }, [rows, search, filter, sort]);

  const submitHouse = async () => {
    const user = getUser();
    try {
      await api.post('/api/house-rent/create', {
        ownerId: user?.id || user?._id,
        location: form.location,
        rent: Number(form.rent || 0),
        rooms: Number(form.rooms || 1),
        description: form.description,
      });
      setForm({ location: '', rent: '', rooms: '', description: '' });
      setShowModal(false);
      await loadRows();
    } catch {
      setError('Failed to create house listing.');
    }
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--fg-muted)' }}>Loading house listings...</div>
      ) : (
      <section className="bento-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {items.map((item) => {
          return (
            <article key={item._id || item.house_id} className="surface-card reveal-on-scroll">
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

              <h4 style={{ marginTop: 16 }}>{item.title || item.location}</h4>
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
                  {Number(item.rent || item.price || 0).toLocaleString()} BDT
                </span>
                <span style={{ color: 'var(--fg-muted)', marginLeft: 6 }}>/month</span>
              </div>

              <div style={{ display: 'flex', gap: 16, color: 'var(--fg-muted)', fontSize: '0.875rem', margin: '12px 0' }}>
                <span><i className="bi bi-geo-alt me-1" />{item.location || '-'}</span>
                <span><i className="bi bi-door-open me-1" />{item.rooms || 1} rooms</span>
              </div>

              <StatusBadge status="available" />
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button className="btn-primary" type="button">Apply</button>
                <button className="btn-ghost" type="button">Details</button>
              </div>
            </article>
          );
        })}
      </section>
      )}
      {error && <div style={{ color: 'var(--danger)', marginTop: 8 }}>{error}</div>}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">Post Rental Property</h5>
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="app-input" placeholder="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Rent</label>
              <input className="app-input" type="number" placeholder="Rent amount" value={form.rent} onChange={(e) => setForm((f) => ({ ...f, rent: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Rooms</label>
              <input className="app-input" type="number" placeholder="Rooms" value={form.rooms} onChange={(e) => setForm((f) => ({ ...f, rooms: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="app-input" rows={4} placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn-primary" type="button" onClick={submitHouse}>Post Property</button>
              <button className="btn-ghost" type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
