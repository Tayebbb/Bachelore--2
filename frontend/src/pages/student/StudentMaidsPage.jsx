import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';
import PopupMessage from '../../components/PopupMessage.jsx';
import { useNavigate } from 'react-router-dom';

export default function StudentMaidsPage() {
  const [rows, setRows] = useState([]);
  const [popup, setPopup] = useState({ show: false, message: '' });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const { data } = await api.get('/api/student/maids');
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    }

    try {
      const { data } = await api.get('/api/student/dashboard');
      setIsSubscribed(data?.isSubscribed || false);
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
      setIsSubscribed(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const apply = async (maidId) => {
    if (!isSubscribed) {
      setPopup({ show: true, message: 'Subscribe to apply for maids!' });
      return;
    }
    try {
      await api.post(`/api/student/maids/${maidId}/apply`);
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
        <h2 className="panel-page-title">Maid Services</h2>
        <p className="panel-page-subtitle">Find approved maid listings and apply instantly.</p>
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
              <p style={{ margin: '4px 0 0 0', fontSize: '0.95em' }}>Subscribe to apply for maids.</p>
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
                <th>Location</th>
                <th>Salary</th>
                <th>Availability</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.maid_id}>
                  <td>{row.location}</td>
                  <td>{row.salary}</td>
                  <td>{row.availability}</td>
                  <td>{row.status}</td>
                  <td>
                    {!isSubscribed ? (
                      <button type="button" className="panel-btn-sm" style={{ background: '#ccc', color: '#888', cursor: 'not-allowed', opacity: 0.7 }} disabled>
                        Locked
                      </button>
                    ) : row.userApplicationStatus && (String(row.userApplicationStatus).toLowerCase() === 'pending' || String(row.userApplicationStatus).toLowerCase() === 'applied') ? (
                      <button type="button" className="panel-btn-sm" style={{ background: '#ccc', color: '#888', cursor: 'not-allowed', opacity: 0.7 }} disabled>
                        Applied
                      </button>
                    ) : (
                      <button type="button" className="panel-btn-sm primary" onClick={() => apply(row.maid_id)}>
                        Apply / Book
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="panel-empty">No approved maid listing found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
