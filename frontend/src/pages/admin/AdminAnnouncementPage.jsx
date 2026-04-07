import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function AdminAnnouncementPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const announcementsRes = await api.get('/api/admin/announcements');
      setAnnouncements(Array.isArray(announcementsRes.data) ? announcementsRes.data : []);
      setError('');
    } catch (err) {
      console.error('Failed to load announcements:', err);
      setAnnouncements([]);
      setError(err?.response?.data?.msg || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      setActionError('Title and description are required.');
      return;
    }

    setActionError('');
    setActionMessage('');
    setFormLoading(true);
    try {
      await api.post('/api/admin/announcements', {
        title: formTitle.trim(),
        message: formDescription.trim(),
      });
      setActionMessage('Announcement posted successfully.');
      setFormTitle('');
      setFormDescription('');
      await load();
    } catch (err) {
      console.error('Failed to post announcement:', err);
      setActionError(err?.response?.data?.msg || 'Failed to create announcement.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    try {
      setActionError('');
      setActionMessage('');
      setDeletingId(announcementId);
      await api.delete(`/api/admin/announcements/${announcementId}`);
      setActionMessage('Announcement deleted successfully.');
      await load();
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      setActionError(err?.response?.data?.msg || 'Failed to delete announcement.');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">Announcements</h2>
        <p className="panel-page-subtitle">Post announcements and manage user requests.</p>
      </header>

      <div className="panel-block">
        <h5 className="panel-block-title" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Post New Announcement
        </h5>
        <form onSubmit={handlePostAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Announcement title"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="app-input"
            required
          />
          <textarea
            placeholder="Announcement description"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            className="app-input"
            style={{ minHeight: '96px', resize: 'vertical', fontFamily: 'var(--font-body)' }}
            required
          />
          <button type="submit" className="panel-btn-sm primary" disabled={formLoading} style={{ alignSelf: 'flex-start' }}>
            {formLoading ? 'Posting...' : 'Post Announcement'}
          </button>
        </form>
      </div>

      {(actionMessage || actionError || error) && (
        <div className="panel-block" style={{ marginTop: 20 }}>
          {actionMessage && <p style={{ marginBottom: 10, color: 'var(--success)', fontWeight: 700 }}>{actionMessage}</p>}
          {actionError && <p style={{ marginBottom: 10, color: 'var(--danger)', fontWeight: 700 }}>{actionError}</p>}
          {error && (
            <div style={{ padding: 16, background: '#f8d7da', borderRadius: 8, color: '#721c24' }}>
              {error}
            </div>
          )}
        </div>
      )}

      <div className="panel-block" style={{ marginTop: 20 }}>
        <h5 className="panel-block-title">All Announcements ({announcements.length})</h5>
        {loading ? (
          <div className="panel-empty">Loading announcements...</div>
        ) : (
          <div className="panel-table-wrap">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((announcement) => (
                  <tr key={announcement.announcement_id}>
                    <td>{announcement.title}</td>
                    <td>{announcement.message}</td>
                    <td>{new Date(announcement.created_at).toLocaleString()}</td>
                    <td>
                      <button
                        type="button"
                        className="panel-btn-sm danger"
                        disabled={deletingId === announcement.announcement_id}
                        onClick={() => handleDeleteAnnouncement(announcement.announcement_id)}
                      >
                        {deletingId === announcement.announcement_id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
                {announcements.length === 0 && (
                  <tr>
                    <td colSpan={4} className="panel-empty">No announcements posted yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
