import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function StudentRoommatesPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ location: '', rent: '', preference: '', type: 'host' });

  const load = async () => {
    try {
      const { data } = await api.get('/api/student/roommates');
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createListing = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/student/roommates', form);
      setForm({ location: '', rent: '', preference: '', type: 'host' });
      load();
    } catch {
      // ignore
    }
  };

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">Roommate Finder</h2>
        <p className="panel-page-subtitle">Create listings and explore available roommate opportunities.</p>
      </header>
      <div className="panel-split panel-split-5-7">
        <div>
          <div className="panel-block">
              <h5 className="panel-block-title">Create Host Listing</h5>
              <form onSubmit={createListing} className="panel-form">
                <input className="app-input" placeholder="Location" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
                <input className="app-input" placeholder="Rent" value={form.rent} onChange={(e) => setForm((p) => ({ ...p, rent: e.target.value }))} />
                <input className="app-input" placeholder="Preference" value={form.preference} onChange={(e) => setForm((p) => ({ ...p, preference: e.target.value }))} />
                <button type="submit" className="btn-primary">Create Listing</button>
              </form>
          </div>
        </div>
        <div>
          <div className="panel-block">
            <div className="panel-table-wrap">
              <table className="table-modern">
                <thead><tr><th>Location</th><th>Rent</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>
                  {rows.map((r) => <tr key={r.listing_id}><td>{r.location}</td><td>{r.rent}</td><td>{r.type}</td><td>{r.status}</td></tr>)}
                  {rows.length === 0 && <tr><td colSpan={4} className="panel-empty">No roommate listings available.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
