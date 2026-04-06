import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';
import PopupMessage from '../../components/PopupMessage.jsx';
import SubscriptionModal from '../../components/SubscriptionModal.jsx';

export default function StudentMarketplacePage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ title: '', price: '', condition: 'used' });
  const [popup, setPopup] = useState({ show: false, message: '' });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/api/student/marketplace');
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

  const postItem = async (e) => {
    e.preventDefault();
    if (!isSubscribed) {
      setPopup({ show: true, message: 'Subscribe to post items!' });
      return;
    }
    try {
      await api.post('/api/student/marketplace', form);
      setForm({ title: '', price: '', condition: 'used' });
      setPopup({ show: true, message: 'Item posted successfully!' });
      load();
    } catch {
      setPopup({ show: true, message: 'Failed to post item.' });
    }
  };

  const buy = async (itemId) => {
    if (!isSubscribed) {
      setPopup({ show: true, message: 'Subscribe to buy items!' });
      return;
    }
    try {
      await api.post(`/api/student/marketplace/${itemId}/buy`);
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
        <h2 className="panel-page-title">Marketplace</h2>
        <p className="panel-page-subtitle">Post items quickly and buy from active student listings.</p>
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
              <p style={{ margin: '4px 0 0 0', fontSize: '0.95em' }}>Subscribe to post and buy items.</p>
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
      <div className="panel-split panel-split-4-8">
        <div>
          <div className="panel-block">
              <h5 className="panel-block-title">Post Item</h5>
              <form onSubmit={postItem} className="panel-form">
                <input className="app-input" placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} disabled={!isSubscribed} />
                <input className="app-input" placeholder="Price" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} disabled={!isSubscribed} />
                <select className="app-select" value={form.condition} onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value }))} disabled={!isSubscribed}>
                  <option value="used">Used</option>
                  <option value="good">Good</option>
                  <option value="new">New</option>
                </select>
                <button type="submit" className="btn-primary" disabled={!isSubscribed} style={{ opacity: isSubscribed ? 1 : 0.5, cursor: isSubscribed ? 'pointer' : 'not-allowed' }}>Post</button>
              </form>
          </div>
        </div>
        <div>
          <div className="panel-block">
            <div className="panel-table-wrap">
              <table className="table-modern">
                <thead><tr><th>Title</th><th>Price</th><th>Condition</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.item_id}>
                      <td>{r.title}</td><td>{r.price}</td><td>{r.condition}</td><td>{r.status}</td>
                      <td>
                        {r.userApplicationStatus && (String(r.userApplicationStatus).toLowerCase() === 'pending' || String(r.userApplicationStatus).toLowerCase() === 'applied') ? (
                          <button type="button" className="panel-btn-sm" style={{ background: '#ccc', color: '#888', cursor: 'not-allowed', opacity: 0.7 }} disabled>
                            Applied
                          </button>
                        ) : (
                          <button type="button" className="panel-btn-sm success" onClick={() => buy(r.item_id)}>
                            Apply / Book
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={5} className="panel-empty">No marketplace data.</td></tr>}
                </tbody>
              </table>
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
                          <button type="button" className="panel-btn-sm success" onClick={() => buy(r.item_id)}>
                            Apply / Book
                          </button>
                        )}
                      </td>
