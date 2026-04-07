import React, { useEffect, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function AnnouncementsAll() {
  const [announcements, setAnnouncements] = useState([]);
  const [allAnnouncements, setAllAnnouncements] = useState(null); 
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtered, setFiltered] = useState([]);
  const pageSize = 5;

  useEffect(() => {
   
    if (searchTerm && searchTerm.length > 0) return;
    fetch(`/api/announcements?page=${page}&limit=${pageSize}`)
      .then(res => res.json())
      .then(data => {
        setAnnouncements(Array.isArray(data.announcements) ? data.announcements : data);
        setTotal(data.total || 0);
      });
  }, [page, searchTerm]);

  const totalPages = Math.ceil(total / pageSize);
  useEffect(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    if (!term) {
      setFiltered([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
     
        if (!allAnnouncements) {
          const res = await fetch(`/api/announcements?page=1&limit=1000`);
          const data = await res.json();
          const list = Array.isArray(data.announcements) ? data.announcements : data;
          if (cancelled) return;
          setAllAnnouncements(list);
          const results = list.filter(a => {
            const text = ((a.title || '') + ' ' + (a.message || a.body || '')).toLowerCase();
            return text.includes(term);
          });
          setFiltered(results);
        } else {
          const results = allAnnouncements.filter(a => {
            const text = ((a.title || '') + ' ' + (a.message || a.body || '')).toLowerCase();
            return text.includes(term);
          });
          if (!cancelled) setFiltered(results);
        }
      } catch (err) {
        console.error('Search error', err);
        if (!cancelled) setFiltered([]);
      }
    }, 250);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchTerm, allAnnouncements]);

  function timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff/60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)} hr ago`;
    if (diff < 2592000) return `${Math.floor(diff/86400)} days ago`;
    return date.toLocaleDateString();
  }

  const rows = searchTerm ? filtered : announcements;

  return (
    <AppShell>
      <div className="surface-card">
        <div className="page-header">
          <div>
            <h4 style={{ marginBottom: 4 }}>All Announcements</h4>
            <small style={{ color: 'var(--fg-muted)' }}>Broadcasts and updates published for all users.</small>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              className="app-input"
              placeholder="Search..."
              style={{ width: 220 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="surface-card">
        {rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--fg-muted)' }}>
            <i className="bi bi-inbox" style={{ fontSize: '3rem', marginBottom: 16, display: 'block' }} />
            <h4>No announcements found</h4>
            <p>Nothing to show here yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Published</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a._id || a.id}>
                    <td>{a.title || '-'}</td>
                    <td>{(a.message || a.body || '-').slice(0, 120)}</td>
                    <td>{timeAgo(a.createdAt)}</td>
                    <td><StatusBadge status={a.status || 'active'} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-ghost" type="button">View</button>
                        <button className="btn-primary" type="button">Open</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!searchTerm && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              className={num === page ? 'btn-primary' : 'btn-ghost'}
              onClick={() => setPage(num)}
              type="button"
            >
              {num}
            </button>
          ))}
        </div>
      )}
    </AppShell>
  );
}
