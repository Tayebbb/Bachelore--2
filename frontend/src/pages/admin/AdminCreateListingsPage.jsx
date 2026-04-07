import React, { useState } from 'react';
import api from '../../components/axios.jsx';
import { getUser } from '../../lib/auth';

export default function AdminCreateListingsPage() {
  const [tuition, setTuition] = useState({ subject: '', location: '', salary: '' });
  const [maid, setMaid] = useState({ availability: '', location: '', salary: '' });
  const [house, setHouse] = useState({ location: '', rent: '', rooms: '', description: '' });

  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const user = getUser();
  const ownerId = user?.id || user?._id || user?.user_id;

  const resetAlerts = () => {
    setMessage('');
    setError('');
  };

  const createTuition = async () => {
    if (!tuition.subject.trim() || !tuition.location.trim() || Number(tuition.salary) <= 0) {
      setError('Tuition requires subject, location, and a valid salary.');
      return;
    }

    try {
      setBusy('tuition');
      resetAlerts();
      await api.post('/api/tuitions', {
        userId: ownerId,
        subject: tuition.subject.trim(),
        location: tuition.location.trim(),
        salary: Number(tuition.salary),
        status: 'pending',
      });
      setTuition({ subject: '', location: '', salary: '' });
      setMessage('Tuition listing created successfully.');
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to create tuition listing.');
    } finally {
      setBusy('');
    }
  };

  const createMaid = async () => {
    if (!maid.availability.trim() || !maid.location.trim() || Number(maid.salary) <= 0) {
      setError('Maid requires availability, location, and a valid salary.');
      return;
    }

    try {
      setBusy('maid');
      resetAlerts();
      await api.post('/api/maids', {
        userId: ownerId,
        availability: maid.availability.trim(),
        location: maid.location.trim(),
        salary: Number(maid.salary),
        status: 'pending',
      });
      setMaid({ availability: '', location: '', salary: '' });
      setMessage('Maid listing created successfully.');
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to create maid listing.');
    } finally {
      setBusy('');
    }
  };

  const createHouse = async () => {
    if (!house.location.trim() || Number(house.rent) <= 0 || Number(house.rooms) <= 0) {
      setError('House rent requires location, rent, and rooms.');
      return;
    }

    try {
      setBusy('house');
      resetAlerts();
      await api.post('/api/house-rent/create', {
        ownerId,
        location: house.location.trim(),
        rent: Number(house.rent),
        rooms: Number(house.rooms),
        description: house.description.trim(),
        status: 'pending',
      });
      setHouse({ location: '', rent: '', rooms: '', description: '' });
      setMessage('House rent listing created successfully.');
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to create house rent listing.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">Create Listings</h2>
        <p className="panel-page-subtitle">Create tuition, maid, and house rent listings directly from admin panel.</p>
      </header>

      {message && <div className="panel-empty" style={{ marginBottom: 12, color: '#86efac', textAlign: 'left' }}>{message}</div>}
      {error && <div className="panel-empty" style={{ marginBottom: 12, color: '#fca5a5', textAlign: 'left' }}>{error}</div>}

      <div className="panel-grid panel-split-6-6">
        <section className="panel-block">
          <h5 className="panel-block-title">Create Tuition</h5>
          <div className="panel-form">
            <input
              className="app-input"
              placeholder="Subject"
              value={tuition.subject}
              onChange={(e) => setTuition((s) => ({ ...s, subject: e.target.value }))}
            />
            <input
              className="app-input"
              placeholder="Location"
              value={tuition.location}
              onChange={(e) => setTuition((s) => ({ ...s, location: e.target.value }))}
            />
            <input
              className="app-input"
              type="number"
              placeholder="Salary"
              value={tuition.salary}
              onChange={(e) => setTuition((s) => ({ ...s, salary: e.target.value }))}
            />
            <button type="button" className="panel-btn-sm success" disabled={busy === 'tuition'} onClick={createTuition}>
              {busy === 'tuition' ? 'Creating...' : 'Create Tuition'}
            </button>
          </div>
        </section>

        <section className="panel-block">
          <h5 className="panel-block-title">Create Maid Listing</h5>
          <div className="panel-form">
            <input
              className="app-input"
              placeholder="Availability / Service Name"
              value={maid.availability}
              onChange={(e) => setMaid((s) => ({ ...s, availability: e.target.value }))}
            />
            <input
              className="app-input"
              placeholder="Location"
              value={maid.location}
              onChange={(e) => setMaid((s) => ({ ...s, location: e.target.value }))}
            />
            <input
              className="app-input"
              type="number"
              placeholder="Salary"
              value={maid.salary}
              onChange={(e) => setMaid((s) => ({ ...s, salary: e.target.value }))}
            />
            <button type="button" className="panel-btn-sm success" disabled={busy === 'maid'} onClick={createMaid}>
              {busy === 'maid' ? 'Creating...' : 'Create Maid'}
            </button>
          </div>
        </section>
      </div>

      <section className="panel-block" style={{ marginTop: 18 }}>
        <h5 className="panel-block-title">Create House Rent Listing</h5>
        <div className="panel-form">
          <input
            className="app-input"
            placeholder="Location"
            value={house.location}
            onChange={(e) => setHouse((s) => ({ ...s, location: e.target.value }))}
          />
          <div className="panel-grid panel-split-6-6">
            <input
              className="app-input"
              type="number"
              placeholder="Monthly Rent"
              value={house.rent}
              onChange={(e) => setHouse((s) => ({ ...s, rent: e.target.value }))}
            />
            <input
              className="app-input"
              type="number"
              placeholder="Rooms"
              value={house.rooms}
              onChange={(e) => setHouse((s) => ({ ...s, rooms: e.target.value }))}
            />
          </div>
          <textarea
            className="app-input"
            rows={4}
            placeholder="Description"
            value={house.description}
            onChange={(e) => setHouse((s) => ({ ...s, description: e.target.value }))}
          />
          <button type="button" className="panel-btn-sm success" disabled={busy === 'house'} onClick={createHouse}>
            {busy === 'house' ? 'Creating...' : 'Create House Rent'}
          </button>
        </div>
      </section>
    </div>
  );
}
