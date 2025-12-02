import React from 'react'

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

import { Link } from 'react-router-dom';

export default function Announcements({ items = [] }){
  const top2 = items.slice(0, 2);
  return (
    <div className="announcements-panel">
      {top2.map(a => (
        <div
          key={a._id || a.id}
          className="announcement-item mb-3 p-3 rounded-4 shadow-sm bg-white border border-1"
          style={{ minHeight: 80, display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          <div className="d-flex align-items-center mb-1">
            <span className="fw-bold fs-5" style={{ color: '#222' }}>{a.title}</span>
          </div>
          <div className="announcement-message mb-2" style={{ color: '#444' }}>{a.message || a.body}</div>
          <div className="announcement-meta small" style={{ color: '#7b8ca7' }}>{timeAgo(a.createdAt)}</div>
        </div>
      ))}
      <div className="d-flex justify-content-end mt-2">
        <Link to="/announcements-all" className="btn btn-link p-0" style={{ color: '#2563eb', fontWeight: 500 }}>See all</Link>
      </div>
    </div>
  )
}
