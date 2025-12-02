import React, { useEffect, useState } from 'react';

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

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">All Announcements</h2>
        <div className="text-muted small">{(searchTerm ? filtered.length : total) || 0} result(s)</div>
      </div>

      <div className="announcements-card mb-4">
        <div className="announcements-header mb-3 d-flex gap-2 align-items-center">
          <div className="flex-grow-1">
            <div className="input-group search-input-group">
              <span className="input-group-text" id="search-addon">🔎</span>
              <input
                type="search"
                className="form-control search-input"
                placeholder="Search announcements by title or message..."
                aria-label="Search announcements"
                aria-describedby="search-addon"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="btn btn-outline-secondary search-clear" onClick={() => { setSearchTerm(''); setFiltered([]); }} aria-label="Clear search">
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="result-count text-muted small">Showing {(searchTerm ? filtered.length : announcements.length)} of {total || '—'}</div>
        </div>

        <div className="announcements-panel">
          {(searchTerm ? filtered : announcements).map(a => (
            <div key={a._id || a.id} className="announcement-item d-flex align-items-start">
              <div className="announcement-content flex-grow-1">
                <div className="d-flex align-items-start justify-content-between">
                  <div>
                    <div className="announcement-title">{a.title}</div>
                  </div>
                  <div className="ps-2">
                    <div className="announcement-meta muted small text-end">{timeAgo(a.createdAt)}</div>
                  </div>
                </div>
                <div className="announcement-message">{a.message || a.body}</div>
              </div>
            </div>
          ))}
          {searchTerm && filtered.length === 0 && (
            <div className="muted">No announcements match your search.</div>
          )}
        </div>
      </div>
      {!searchTerm && (
        <div className="d-flex gap-2 justify-content-center mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              className={`btn px-3 py-2 fw-bold ${num === page ? 'bg-primary text-white border-0' : ''}`}
              style={{
                borderRadius: 8,
                outline: 'none',
                boxShadow: num === page ? '0 0 0 2px #228be6' : undefined,
                background: num === page ? undefined : 'linear-gradient(135deg, #e3f0fc 0%, #b6d6f6 100%)',
                color: num === page ? '#fff' : '#1971c2',
                border: num === page ? 'none' : '2px solid #228be6',
                fontWeight: 700
              }}
              onClick={() => setPage(num)}
            >
              {num}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
