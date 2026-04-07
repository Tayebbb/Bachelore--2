import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/student/announcements');
      setAnnouncements(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setAnnouncements([]);
      setError(err?.response?.data?.msg || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">Announcements</h2>
        <p className="panel-page-subtitle">Latest notices posted by admin.</p>
      </header>

      <div className="panel-block">
        {loading && <div className="panel-empty">Loading announcements...</div>}
        {!loading && error && <div className="panel-empty" style={{ color: '#fca5a5' }}>{error}</div>}

        {!loading && !error && (
          <div style={{ display: 'grid', gap: 14 }}>
            {announcements.map((item) => (
              <article
                key={item.announcement_id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                }}
              >
                <h4 style={{ margin: 0, marginBottom: 6, fontSize: '1.02rem' }}>{item.title}</h4>
                <p style={{ margin: 0, color: 'var(--fg-muted)', lineHeight: 1.6 }}>{item.message}</p>
                <div style={{ marginTop: 10, fontSize: '0.84rem', color: 'var(--fg-subtle)' }}>
                  Posted {new Date(item.created_at).toLocaleString()}
                </div>
              </article>
            ))}

            {announcements.length === 0 && (
              <div className="panel-empty">No announcements available right now.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
