import React, { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import api from '../components/axios.jsx';
import { getUser } from '../lib/auth';

export default function RoommatesModern() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ location: '', rent: '', roomsAvailable: '', details: '', contact: '' });

  const loadRows = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/roommates/listings');
      setRows(Array.isArray(data) ? data : []);
      setError('');
    } catch {
      setRows([]);
      setError('Failed to load roommate listings.');
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
      const text = `${item.name || ''} ${item.location || ''} ${item.details || ''} ${item.contact || ''}`.toLowerCase();
      const matchesQ = !q || text.includes(q);
      const matchesFilter = filter === 'all' || (item.name || '').toLowerCase().includes(filter);
      const matchesArea = sort === 'all' || (item.location || '').toLowerCase().includes(sort);
      return matchesQ && matchesFilter && matchesArea;
    });
  }, [rows, search, filter, sort]);

  const submitListing = async () => {
    const user = getUser();
    const userId = user?.id || user?._id;
    try {
      await api.post(`/api/roommates/${userId}/apply`, {
        location: form.location,
        rent: Number(form.rent || 0),
        roomsAvailable: form.roomsAvailable,
        details: form.details,
        name: user?.name || user?.fullName || '',
        email: user?.email || '',
        contact: form.contact,
      });
      setForm({ location: '', rent: '', roomsAvailable: '', details: '', contact: '' });
      setShowModal(false);
      await loadRows();
    } catch {
      setError('Failed to create roommate listing.');
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
            placeholder="Search by listing, location, or contact"
          />
          <select className="app-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Any Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="any">Any</option>
          </select>
          <select className="app-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="all">All Areas</option>
            <option value="farmgate">Farmgate</option>
            <option value="shyamoli">Shyamoli</option>
            <option value="mirpur">Mirpur</option>
          </select>
          <button className="btn-primary" type="button" onClick={() => setShowModal(true)}>Add Listing</button>
        </div>
      </section>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--fg-muted)' }}>Loading roommate listings...</div>
      ) : (
      <section className="bento-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {items.map((item) => (
          <article key={item._id || item.listing_id} className="surface-card reveal-on-scroll">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  border: '2px solid var(--accent)',
                  background: 'var(--bg-elevated)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                }}
              >
                {(item.name || 'RM').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 style={{ marginBottom: 2 }}>{item.name || 'Host Listing'}</h4>
                <div className="text-label">University: BacheLORE Campus</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {(item.details || '').split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 3).map((tag) => (
                <span
                  key={`${item._id || item.listing_id}-${tag}`}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-elevated)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'var(--fg-muted)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ color: 'var(--accent)', fontWeight: 700 }}>{Number(item.rent || 0).toLocaleString()} BDT</div>
              <div style={{ color: 'var(--fg-muted)' }}>{item.location} - {item.roomsAvailable || 'N/A'} seats</div>
            </div>

            <StatusBadge status="available" />
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn-primary" type="button">Connect</button>
              <button className="btn-ghost" type="button">View</button>
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
              <h5 className="modal-title">Add Roommate Listing</h5>
            </div>
            <div className="form-group">
              <label className="form-label">Area</label>
              <input className="app-input" placeholder="Preferred area" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Budget</label>
              <input className="app-input" type="number" placeholder="Monthly budget" value={form.rent} onChange={(e) => setForm((f) => ({ ...f, rent: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Seats Available</label>
              <input className="app-input" placeholder="e.g., 2" value={form.roomsAvailable} onChange={(e) => setForm((f) => ({ ...f, roomsAvailable: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact</label>
              <input className="app-input" placeholder="Phone or email" value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Details</label>
              <textarea className="app-input" rows={4} placeholder="Comma separated preferences" value={form.details} onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn-primary" type="button" onClick={submitListing}>Save Listing</button>
              <button className="btn-ghost" type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
