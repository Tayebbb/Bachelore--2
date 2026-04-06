import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function StudentAnnouncementPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingKey, setActionLoadingKey] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [userRequests, setUserRequests] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const announcementsRes = await api.get('/api/student/announcements');
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

  const loadUserRequests = async () => {
    try {
      const personalRes = await api.get('/api/student/personal-activity');
      const requests = (personalRes.data || []).filter((a) => a.action_type === 'request_announcement');
      setUserRequests(requests);
    } catch {
      setUserRequests([]);
    }
  };

  useEffect(() => {
    load();
    loadUserRequests();
  }, []);

  const hasUserRequested = (announcementId) => {
    return userRequests.some((r) => r.reference_id === announcementId);
  };

  const sendRequest = async (announcement) => {
    const loadingKey = `send-request-${announcement.announcement_id}`;
    setActionMessage('');
    setActionError('');
    setActionLoadingKey(loadingKey);

    try {
      await api.post(`/api/student/announcements/${announcement.announcement_id}/request`);
      setActionMessage(`Request sent for "${announcement.title}" successfully!`);
      await loadUserRequests();
    } catch (err) {
      console.error('Failed to send request:', err);
      const msg = err?.response?.data?.msg || 'Failed to send request.';
      const detail = err?.response?.data?.error;
      setActionError(detail ? `${msg} (${detail})` : msg);
    } finally {
      setActionLoadingKey('');
    }
  };

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">Announcements</h2>
        <p className="panel-page-subtitle">Browse announcements and send requests.</p>
      </header>

      {/* Messages */}
      <div className="panel-block">
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
          <div className="panel-table-wrap">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Posted By</th>
                  <th>Posted At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((announcement) => (
                  <tr key={announcement.announcement_id}>
                    <td style={{ fontWeight: 600 }}>{announcement.title}</td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {announcement.message}
                    </td>
                    <td>{announcement.created_by_name || 'Admin'}</td>
                    <td>{new Date(announcement.created_at).toLocaleDateString()}</td>
                    <td className="panel-actions">
                      {hasUserRequested(announcement.announcement_id) ? (
                        <button
                          type="button"
                          className="panel-btn-sm"
                          style={{ background: '#ccc', color: '#888', cursor: 'not-allowed', opacity: 0.7 }}
                          disabled
                        >
                          Requested
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="panel-btn-sm primary"
                          onClick={() => sendRequest(announcement)}
                          disabled={actionLoadingKey === `send-request-${announcement.announcement_id}`}
                        >
                          {actionLoadingKey === `send-request-${announcement.announcement_id}` ? 'Sending...' : 'Send Request'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {announcements.length === 0 && (
                  <tr>
                    <td colSpan={5} className="panel-empty">No announcements available.</td>
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
