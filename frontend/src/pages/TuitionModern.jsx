import React, { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import api from '../components/axios.jsx';
import { getUser } from '../lib/auth';

export default function TuitionModern() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('latest');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ subject: '', location: '', salary: '' });

  const loadRows = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/tuitions');
      setRows(Array.isArray(data) ? data : []);
      setError('');
    } catch {
      setError('Failed to load tuition listings.');
      setRows([]);
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
      const title = item.title || item.subject || '';
      const location = item.location || '';
      const status = (item.status || 'open').toLowerCase();
      const matchesQ = !q || `${title} ${location}`.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || status.includes(filter);
      return matchesQ && matchesFilter;
    });

    if (sort === 'priceAsc') filtered = [...filtered].sort((a, b) => Number(a.salary || 0) - Number(b.salary || 0));
    if (sort === 'priceDesc') filtered = [...filtered].sort((a, b) => Number(b.salary || 0) - Number(a.salary || 0));
    return filtered;
  }, [rows, search, filter, sort]);

  const submitPost = async () => {
    const user = getUser();
    try {
      await api.post('/api/tuitions', {
        userId: user?.id || user?._id,
        subject: form.subject,
        location: form.location,
        salary: Number(form.salary || 0),
        status: 'open',
      });
      setForm({ subject: '', location: '', salary: '' });
      setShowModal(false);
      await loadRows();
    } catch {
      setError('Failed to create tuition listing.');
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--fg-muted)' }}>Loading tuition listings...</div>
      ) : items.length === 0 ? (
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
            <article key={item._id || item.tuition_id} className="feature-card reveal-on-scroll">
              <div className="feature-card-icon">
                <i className="bi bi-journal-text" />
              </div>
              <h4>{item.title || item.subject}</h4>
              <p>{item.location} - {Number(item.salary || 0).toLocaleString()} BDT</p>
              <StatusBadge status={item.status || 'open'} />
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button className="btn-primary" type="button">Book</button>
                <button className="btn-ghost" type="button">Details</button>
              </div>
            </article>
          ))}
        </section>
      )}
      {error && <div style={{ color: 'var(--danger)', marginTop: 8 }}>{error}</div>}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">Post Tuition Listing</h5>
            </div>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input className="app-input" placeholder="Enter subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="app-input" placeholder="Enter location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Rate</label>
              <input className="app-input" type="number" placeholder="Monthly rate" value={form.salary} onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn-primary" type="button" onClick={submitPost}>Post Tuition</button>
              <button className="btn-ghost" type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
