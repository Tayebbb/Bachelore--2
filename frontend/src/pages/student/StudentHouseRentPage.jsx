import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';
import PopupMessage from '../../components/PopupMessage.jsx';
import SubscriptionModal from '../../components/SubscriptionModal.jsx';

export default function StudentHouseRentPage() {
  const [rows, setRows] = useState([]);
  const [popup, setPopup] = useState({ show: false, message: '' });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/api/student/house-rent');
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

  const contact = async (houseId) => {
    if (!isSubscribed) {
      setPopup({ show: true, message: 'Subscribe to contact house owners!' });
      return;
    }
    try {
      await api.post('/api/student/house-rent/contact', { houseId, message: 'I am interested in this listing.' });
      setPopup({ show: true, message: 'Request submitted to owner!' });
      load();
    } catch {
      setPopup({ show: true, message: 'Failed to submit request.' });
    }
  };

  return (
    <div className="panel-page">
      <PopupMessage message={popup.message} show={popup.show} onClose={() => setPopup({ ...popup, show: false })} />
      <SubscriptionModal
        show={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={() => {
          setShowSubscriptionModal(false);
          load();
        }}
      />
      <header className="panel-page-header">
        <h2 className="panel-page-title">House Rent</h2>
        <p className="panel-page-subtitle">Browse verified rent listings and contact owners directly.</p>
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
              <p style={{ margin: '4px 0 0 0', fontSize: '0.95em' }}>Subscribe to contact house owners.</p>
            </div>
            <button
              onClick={() => setShowSubscriptionModal(true)}
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
              <tr><th>Location</th><th>Rent</th><th>Rooms</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.house_id}>
                  <td>{r.location}</td>
                  <td>{r.rent}</td>
                  <td>{r.rooms}</td>
                  <td>{r.status}</td>
                  <td>
                    {!isSubscribed ? (
                      <button type="button" className="panel-btn-sm" style={{ background: '#ccc', color: '#888', cursor: 'not-allowed', opacity: 0.7 }} disabled>
                        Locked
                      </button>
                    ) : r.userApplicationStatus && (String(r.userApplicationStatus).toLowerCase() === 'pending' || String(r.userApplicationStatus).toLowerCase() === 'applied') ? (
                      <button type="button" className="panel-btn-sm" style={{ background: '#ccc', color: '#888', cursor: 'not-allowed', opacity: 0.7 }} disabled>
                        Applied
                      </button>
                    ) : (
                      <button type="button" className="panel-btn-sm primary" onClick={() => contact(r.house_id)}>
                        Apply / Book
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="panel-empty">No approved house listings.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
