import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function AdminAnnouncementPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const announcementsRes = await api.get('/api/admin/announcements');
      setAnnouncements(Array.isArray(announcementsRes.data) ? announcementsRes.data : []);
      setError('');
    } catch (err) {
      console.error('Failed to load announcements:', err);
      setAnnouncements([]);
      setError(err?.response?.data?.msg || 'Failed to load announcement data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formMessage.trim()) {
      setActionError('Title and message are required.');
      return;
    }

    setActionError('');
    setFormLoading(true);
    try {
      await api.post('/api/admin/announcements', {
        title: formTitle,
        message: formMessage,
      });
      setActionMessage('Announcement posted successfully!');
      setFormTitle('');
      setFormMessage('');
      await load();
    } catch (err) {
      console.error('Failed to post announcement:', err);
      setActionError(err?.response?.data?.msg || 'Failed to post announcement.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">Announcements</h2>
        <p className="panel-page-subtitle">Post announcements to students.</p>
      </header>

      {/* Post Announcement Form */}
      <div className="panel-block">
        <h5 className="panel-block-title">Post New Announcement</h5>
        <form onSubmit={handlePostAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Announcement Title"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
            }}
            required
          />
          <textarea
            placeholder="Announcement Message"
            value={formMessage}
            onChange={(e) => setFormMessage(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              minHeight: '80px',
              fontFamily: 'inherit',
            }}
            required
          />
          <button
            type="submit"
            className="panel-btn-sm primary"
            disabled={formLoading}
            style={{ alignSelf: 'flex-start' }}
          >
            {formLoading ? 'Posting...' : 'Post Announcement'}
          </button>
        </form>
      </div>

      {/* Messages */}
      <div className="panel-block" style={{ marginTop: 20 }}>
        {actionMessage && (
          <p style={{ marginBottom: 12, color: 'var(--success)', fontWeight: 600 }}>{actionMessage}</p>
        )}
        {actionError && (
          <p style={{ marginBottom: 12, color: 'var(--danger)', fontWeight: 600 }}>{actionError}</p>
        )}
        {loading && (
          <div style={{ padding: '20px', color: '#999' }}>
            Loading announcements...
          </div>
        )}
        {!loading && error && (
          <div style={{ padding: '20px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '6px', color: '#721c24' }}>
            {error}
          </div>
        )}
      </div>

      {/* Announcements List */}
      {!loading && !error && (
        <div className="panel-block" style={{ marginTop: 20 }}>
          <h5 className="panel-block-title">Recent Announcements</h5>
          <div className="panel-table-wrap">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Created By</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((announcement) => (
                  <tr key={announcement.announcement_id}>
                    <td>{announcement.title}</td>
                    <td>{announcement.created_by_name || 'System'}</td>
                    <td>{new Date(announcement.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {announcements.length === 0 && (
                  <tr>
                    <td colSpan={3} className="panel-empty">No announcements yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
