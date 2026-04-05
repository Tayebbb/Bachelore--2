import React, { useMemo, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const data = [
  { id: 'r1', title: 'Host: 2 Seats Available', location: 'Farmgate', price: '5500 BDT', status: 'Pending', contact: '017XXXXXXXX' },
  { id: 'r2', title: 'Seeker: CSE Student', location: 'Shyamoli', price: '5000 BDT', status: 'Approved', contact: '018XXXXXXXX' },
  { id: 'r3', title: 'Host: Shared Flat', location: 'Mirpur', price: '6000 BDT', status: 'Booked', contact: '019XXXXXXXX' },
];

export default function RoommatesModern() {
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

  const getTags = (row) => {
    if (row.id === 'r1') return ['Night Owl', 'Quiet', 'Non-smoker'];
    if (row.id === 'r2') return ['Early Riser', 'Clean', 'Student'];
    return ['Friendly', 'Organized', 'Budget-focused'];
  };

  const getGender = (row) => {
    if (row.id === 'r1') return 'Male';
    if (row.id === 'r2') return 'Female';
    return 'Any';
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
            <option value="latest">All Areas</option>
            <option value="farmgate">Farmgate</option>
            <option value="shyamoli">Shyamoli</option>
            <option value="mirpur">Mirpur</option>
          </select>
          <button className="btn-primary" type="button" onClick={() => setShowModal(true)}>Add Listing</button>
        </div>
      </section>

      <section className="bento-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {items.map((item) => (
          <article key={item.id} className="surface-card reveal-on-scroll">
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
                {item.title.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 style={{ marginBottom: 2 }}>{item.title}</h4>
                <div className="text-label">University: BacheLORE Campus</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {getTags(item).map((tag) => (
                <span
                  key={tag}
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
              <div style={{ color: 'var(--accent)', fontWeight: 700 }}>{item.price}</div>
              <div style={{ color: 'var(--fg-muted)' }}>{item.location} - {getGender(item)}</div>
            </div>

            <StatusBadge status={item.status} />
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn-primary" type="button">Connect</button>
              <button className="btn-ghost" type="button">View</button>
            </div>
          </article>
        ))}
      </section>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">Add Roommate Listing</h5>
            </div>
            <div className="form-group">
              <label className="form-label">Listing Title</label>
              <input className="app-input" placeholder="Host or seeker title" />
            </div>
            <div className="form-group">
              <label className="form-label">Area</label>
              <input className="app-input" placeholder="Preferred area" />
            </div>
            <div className="form-group">
              <label className="form-label">Budget</label>
              <input className="app-input" type="number" placeholder="Monthly budget" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn-primary" type="button" onClick={() => setShowModal(false)}>Save Listing</button>
              <button className="btn-ghost" type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
