import React, { useEffect, useState } from 'react'
import { getUser } from '../lib/auth'
import AppShell from '../components/AppShell.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

export default function RoommateListings(){
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(()=>{
    const u = getUser();
    setUser(u);
    const load = async () => {
      if(!u){ setLoading(false); return; }
      try{
        const res = await fetch(`/api/roommates/listings?userId=${u.id}`);
        if(res.ok){ const data = await res.json(); setListings(data); }
        else { const data = await res.json(); alert(data.msg || data.error || 'Cannot load listings'); }
      }catch(err){ alert('Network error'); }
      finally{ setLoading(false); }
    }
    load();
  },[]);

  const data = listings.filter((l) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    const text = `${l.name || ''} ${l.location || ''} ${l.details || ''}`.toLowerCase();
    return text.includes(q);
  });

  if(loading) return <AppShell><div>Loading...</div></AppShell>
  if(!user) return <AppShell><div className="surface-card"><div style={{ color: 'var(--fg-muted)' }}>Login as seeker to view listings.</div></div></AppShell>

  return (
    <AppShell>
      <div className="surface-card">
        <div className="page-header">
          <div>
            <h4 style={{ marginBottom: 4 }}>Available Rooms</h4>
            <small style={{ color: 'var(--fg-muted)' }}>Hosts verified by admin.</small>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              className="app-input"
              placeholder="Search..."
              style={{ width: 220 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="surface-card">
        {data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--fg-muted)' }}>
            <i className="bi bi-inbox" style={{ fontSize: '3rem', marginBottom: 16, display: 'block' }} />
            <h4>No listings found</h4>
            <p>Nothing to show here yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Host</th>
                  <th>Location</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((l) => (
                  <tr key={l._id}>
                    <td>{l.name || '-'}</td>
                    <td>{l.location || '-'} - {l.roomsAvailable || '-'}</td>
                    <td>{l.details || '-'}</td>
                    <td><StatusBadge status={l.status || 'approved'} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-ghost" type="button">View</button>
                        <a className="btn-primary" href={`mailto:${l.email}`}>Contact</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}
