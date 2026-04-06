import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function StudentProfilePage() {
  const [form, setForm] = useState({ name: '', email: '' });

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

  const paySubscription = async () => {
    try {
      await api.post('/api/student/subscription/pay', { amount: 99 });
    } catch {
      // ignore for now
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
              <p className="panel-page-subtitle">Subscribe to unlock all paid modules (৳99/month).</p>
              <button type="button" className="panel-btn-sm success" onClick={paySubscription}>Pay ৳99</button>
          </div>
        </div>
      </div>
    </div>
  );
}
