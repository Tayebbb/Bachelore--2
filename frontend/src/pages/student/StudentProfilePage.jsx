import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';
import { useNavigate } from 'react-router-dom';

export default function StudentProfilePage() {
  const [form, setForm] = useState({ name: '', email: '' });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loadingSubscriptionAction, setLoadingSubscriptionAction] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/student/profile');
        setForm({
          name: data?.name || '',
          email: data?.email || '',
        });
      } catch {
        setForm({ name: '', email: '' });
      }

      try {
        const { data } = await api.get('/api/student/dashboard');
        setIsSubscribed(Boolean(data?.isSubscribed));
      } catch {
        setIsSubscribed(false);
      }
    };
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/student/profile', form);
    } catch {
      // ignore for now
    }
  };

  const paySubscription = () => {
    navigate('/subscribe');
  };

  const unsubscribe = async () => {
    const ok = window.confirm('Are you sure you want to unsubscribe?');
    if (!ok) return;

    try {
      setLoadingSubscriptionAction(true);
      await api.post('/api/student/subscription/unsubscribe');
      setIsSubscribed(false);
    } catch {
      // ignore for now
    } finally {
      setLoadingSubscriptionAction(false);
    }
  };

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">Profile & Subscription</h2>
        <p className="panel-page-subtitle">Manage your profile and subscription status from student panel.</p>
      </header>

      <div className="panel-split panel-split-6-6">
        <div>
          <div className="panel-block">
              <h5 className="panel-block-title">Profile</h5>
              <form onSubmit={save} className="panel-form">
                <input
                  className="app-input"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Name"
                />
                <input
                  className="app-input"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Email"
                />
                <button type="submit" className="btn-primary">Save Profile</button>
              </form>
          </div>
        </div>

        <div>
          <div className="panel-block">
              <h5 className="panel-block-title">Subscription</h5>
              <p className="panel-page-subtitle">
                {isSubscribed
                  ? 'You are subscribed. All paid modules are unlocked.'
                  : 'Subscribe to unlock all paid modules (৳99/month).'}
              </p>
              {isSubscribed ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button type="button" className="panel-btn-sm success" disabled style={{ opacity: 0.8, cursor: 'default' }}>
                    Subscribed
                  </button>
                  <button
                    type="button"
                    onClick={unsubscribe}
                    disabled={loadingSubscriptionAction}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: '1px solid #b02a37',
                      backgroundColor: loadingSubscriptionAction ? '#c65d69' : '#dc3545',
                      color: '#ffffff',
                      fontWeight: 600,
                      cursor: loadingSubscriptionAction ? 'not-allowed' : 'pointer',
                      opacity: loadingSubscriptionAction ? 0.85 : 1,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {loadingSubscriptionAction ? 'Processing...' : 'Unsubscribe'}
                  </button>
                </div>
              ) : (
                <button type="button" className="panel-btn-sm success" onClick={paySubscription}>Pay ৳99</button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
