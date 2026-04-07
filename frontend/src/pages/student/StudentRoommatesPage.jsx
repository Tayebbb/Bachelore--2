import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';
import PopupMessage from '../../components/PopupMessage.jsx';
import SubscriptionModal from '../../components/SubscriptionModal.jsx';

export default function StudentRoommatesPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ location: '', rent: '', preference: '', type: 'host' });
  const [popup, setPopup] = useState({ show: false, message: '' });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/api/student/roommates');
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    }
    
    // Fetch subscription status
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

  const createListing = async (e) => {
    e.preventDefault();
    if (!isSubscribed) {
      setPopup({ show: true, message: 'Subscribe to create listings!' });
      return;
    }
    try {
      await api.post('/api/student/roommates', form);
      setForm({ location: '', rent: '', preference: '', type: 'host' });
      setPopup({ show: true, message: 'Listing created successfully!' });
      load();
    } catch {
      setPopup({ show: true, message: 'Failed to create listing.' });
    }
  };

  const apply = async (listingId) => {
    if (!isSubscribed) {
      setPopup({ show: true, message: 'Subscribe to apply for listings!' });
      return;
    }
    try {
      await api.post(`/api/student/roommates/${listingId}/apply`);
      setPopup({ show: true, message: 'Request submitted for approval!' });
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
        <h2 className="panel-page-title">Roommate Finder</h2>
        <p className="panel-page-subtitle">Create listings and explore available roommate opportunities.</p>
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
              <p style={{ margin: '4px 0 0 0', fontSize: '0.95em' }}>Subscribe to create listings and apply for opportunities.</p>
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
      <div className="panel-split panel-split-5-7">
        <div>
          <div className="panel-block">
              <h5 className="panel-block-title">Create Host Listing</h5>
              <form onSubmit={createListing} className="panel-form">
                <input className="app-input" placeholder="Location" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} disabled={!isSubscribed} />
                <input className="app-input" placeholder="Rent" value={form.rent} onChange={(e) => setForm((p) => ({ ...p, rent: e.target.value }))} disabled={!isSubscribed} />
                <input className="app-input" placeholder="Preference" value={form.preference} onChange={(e) => setForm((p) => ({ ...p, preference: e.target.value }))} disabled={!isSubscribed} />
                <button type="submit" className="btn-primary" disabled={!isSubscribed} style={{ opacity: isSubscribed ? 1 : 0.5, cursor: isSubscribed ? 'pointer' : 'not-allowed' }}>
                  Create Listing
                </button>
              </form>
          </div>
        </div>
        <div>
          <div className="panel-block">
            <div className="panel-table-wrap">
              <table className="table-modern">
                <thead><tr><th>Location</th><th>Rent</th><th>Type</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.listing_id}>
                      <td>{r.location}</td>
                      <td>{r.rent}</td>
                      <td>{r.type}</td>
                      <td>{r.status}</td>
                      <td>
                        {(() => {
                          const applicationStatus = String(r.userApplicationStatus || '').toLowerCase();
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
                              <button type="button" className="panel-btn-sm primary" onClick={() => apply(r.listing_id)}>
                                Reapply
                              </button>
                            );
                          }

                          return (
                            <button type="button" className="panel-btn-sm primary" onClick={() => apply(r.listing_id)}>
                              Apply / Book
                            </button>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={5} className="panel-empty">No roommate listings available.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
