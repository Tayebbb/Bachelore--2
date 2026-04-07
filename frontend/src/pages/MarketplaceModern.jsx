import React, { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import api from '../components/axios.jsx';
import { getUser } from '../lib/auth';

export default function MarketplaceModern() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', condition: 'used', price: '' });

  const loadRows = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/marketplace');
      setRows(Array.isArray(data) ? data : []);
      setError('');
    } catch {
      setRows([]);
      setError('Failed to load marketplace listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = rows.filter((item) => {
      const matchesQ = !q || `${item.title || ''} ${item.sellerEmail || ''} ${item.condition || ''}`.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || item.status.toLowerCase().includes(filter);
      return matchesQ && matchesFilter;
    });
    return filtered;
  }, [rows, search, filter]);

  const submitItem = async () => {
    const user = getUser();
    try {
      await api.post('/api/marketplace', {
        userId: user?.id || user?._id,
        title: form.title,
        condition: form.condition,
        price: Number(form.price || 0),
        status: 'available',
      });
      setForm({ title: '', condition: 'used', price: '' });
      setShowModal(false);
      await loadRows();
    } catch {
      setError('Failed to create marketplace listing.');
    }
  };

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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--fg-muted)' }}>Loading marketplace listings...</div>
      ) : (
      <section className="bento-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {items.map((item) => {
          const isSold = item.status.toLowerCase().includes('booked') || item.status.toLowerCase().includes('sold');
          return (
            <article key={item._id || item.item_id} className="feature-card reveal-on-scroll">
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
                {Number(item.price || 0).toLocaleString()} BDT
              </div>
              <p style={{ color: 'var(--fg-muted)' }}>Seller: {item.sellerEmail || '-'} - {item.condition || 'used'}</p>
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
      )}
      {error && <div style={{ color: 'var(--danger)', marginTop: 8 }}>{error}</div>}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">List Marketplace Item</h5>
            </div>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="app-input" placeholder="Item title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="app-select" value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}>
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Price</label>
              <input className="app-input" type="number" placeholder="Price" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn-primary" type="button" onClick={submitItem}>List Item</button>
              <button className="btn-ghost" type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
