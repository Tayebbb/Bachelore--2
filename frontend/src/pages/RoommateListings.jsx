import React, { useEffect, useState } from 'react'
import { getUser } from '../lib/auth'

export default function RoommateListings(){
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

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

  if(loading) return <main className="container py-5"><div>Loading...</div></main>
  if(!user) return <main className="container py-5"><div className="alert alert-secondary">Login as seeker to view listings.</div></main>

  return (
    <main className="container py-5">
      <h3>Available Rooms</h3>
      <p className="muted">Hosts verified by admin.</p>
      {listings.length === 0 ? <div className="muted">No listings yet.</div> : (
        <div className="row g-3">
          {listings.map(l => (
            <div className="col-md-6" key={l._id}>
              <div className="card p-3">
                <h5>{l.name}</h5>
                <div className="small muted">{l.location} • {l.roomsAvailable}</div>
                <p className="mt-2">{l.details}</p>
                <div className="d-flex gap-2">
                  <a className="btn btn-primary" href={`mailto:${l.email}`}>Contact</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
