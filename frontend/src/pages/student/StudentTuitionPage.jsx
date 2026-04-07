import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';
import PopupMessage from '../../components/PopupMessage.jsx';
import { useNavigate } from 'react-router-dom';
import { getSubscriptionActive, setSubscriptionActive } from '../../lib/auth';

export default function StudentTuitionPage() {
  const [rows, setRows] = useState([]);
  const [popup, setPopup] = useState({ show: false, message: '' });
  const [isSubscribed, setIsSubscribed] = useState(() => getSubscriptionActive() ?? false);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const { data } = await api.get('/api/student/tuitions');
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    }

    try {
      const { data } = await api.get('/api/student/dashboard');
      const nextSubscribed = Boolean(data?.isSubscribed);
      setIsSubscribed(nextSubscribed);
      setSubscriptionActive(nextSubscribed);
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const apply = async (tuitionId) => {
    if (!isSubscribed) {
      setPopup({ show: true, message: 'Subscribe to apply for tuitions!' });
      return;
    }
    try {
      await api.post(`/api/student/tuitions/${tuitionId}/apply`);
      setPopup({ show: true, message: 'Request submitted for approval!' });
      load();
    } catch {
      setPopup({ show: true, message: 'Failed to submit request.' });
    }
  };

  return (
    <div className="panel-page">
      <PopupMessage message={popup.message} show={popup.show} onClose={() => setPopup({ ...popup, show: false })} />
      {/* Subscription modal removed, replaced with navigation to /subscribe */}
      <header className="panel-page-header">
        <h2 className="panel-page-title">Approved Tuitions</h2>
        <p className="panel-page-subtitle">Browse approved tuition posts and apply directly.</p>
      </header>
      {!isSubscribed && (
        <div style={{
          padding: '16px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          color: '#721c24'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
            <div>
              <strong><i className="bi bi-lock-fill" style={{ marginRight: '8px' }} />Features Locked</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.95em' }}>Subscribe to apply for tuitions.</p>
            </div>
            <button
              onClick={() => navigate('/subscribe')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9em',
                whiteSpace: 'nowrap'
              }}
            >
              Subscribe
            </button>
          </div>
        </div>
      )}

      <div className="panel-block">
        <div className="panel-table-wrap">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Salary</th>
                <th>Location</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.tuition_id}>
                  <td>{row.subject}</td>
                  <td>{Number(row.salary || 0).toLocaleString()}</td>
                  <td>{row.location}</td>
                  <td>{row.status}</td>
                  <td>
                    {(() => {
                      const applicationStatus = String(row.userApplicationStatus || '').toLowerCase();
                      if (!isSubscribed) {
                        return (
                          <button type="button" className="panel-btn-sm" style={{ background: '#ccc', color: '#888', cursor: 'not-allowed', opacity: 0.7 }} disabled>
                            Locked
                          </button>
                        );
                      }

                      if (applicationStatus === 'pending') {
                        return (
                          <button type="button" className="panel-btn-sm" style={{ background: '#ccc', color: '#888', cursor: 'not-allowed', opacity: 0.7 }} disabled>
                            Pending Approval
                          </button>
                        );
                      }

                      if (applicationStatus === 'approved' || applicationStatus === 'booked') {
                        return (
                          <button type="button" className="panel-btn-sm" style={{ background: '#cfe8ff', color: '#174ea6', cursor: 'not-allowed', opacity: 0.9 }} disabled>
                            Booked
                          </button>
                        );
                      }

                      if (applicationStatus === 'rejected') {
                        return (
                          <button type="button" className="panel-btn-sm primary" onClick={() => apply(row.tuition_id)}>
                            Reapply
                          </button>
                        );
                      }

                      return (
                        <button type="button" className="panel-btn-sm primary" onClick={() => apply(row.tuition_id)}>
                          Apply / Book
                        </button>
                      );
                    })()}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="panel-empty">No approved tuition listings available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
