import React, { useEffect, useState } from 'react'
import ListingCard from '../components/ListingCard'
import { getUser } from '../lib/auth'

export default function Roommates(){
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState(null);
  const [listings, setListings] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', contact: '', location: '', roomsAvailable: '', details: '' });
  const [flash, setFlash] = useState(null); // { text, type }

  const showFlash = (text, type = 'info', ttl = 3500) => {
    setFlash({ text, type });
    if (ttl > 0) setTimeout(() => setFlash(null), ttl);
  }

  useEffect(()=>{
    const u = getUser();
    setUser(u);
    const load = async ()=>{
      if(u){
        // try fetch my listing
        try{ const r = await fetch(`/api/roommates/${u.id}/listing`); if(r.ok){ const j = await r.json(); setListing(j); setForm({ name: j.name||'', email: j.email||'', contact: j.contact||'', location: j.location||'', roomsAvailable: j.roomsAvailable||'', details: j.details||'' }); } }
        catch(e){}
      }
      // fetch public listings (seekers only) - if user is host, backend will reject; in that case show demo
      try{
        const uid = u ? u.id : '';
        const r = await fetch(`/api/roommates/listings?userId=${uid}`);
        if(r.ok){ const j = await r.json(); setListings(j); }
        else { const data = await r.json(); console.warn('Could not fetch listings', data); setListings([]); }
  }catch(e){ setListings([]); }
      setLoading(false);
    }
    load();
  },[]);

  const applyAsHost = async (e) => {
    e.preventDefault();
  if(!user){ showFlash('Please login to apply as host', 'info'); return }
    try{
      const res = await fetch(`/api/roommates/${user.id}/apply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if(res.ok){ setListing(data.listing); showFlash('You are now listed as a host', 'success'); }
      else showFlash(data.msg || data.error || 'Error', 'error');
    }catch(err){ showFlash('Network error', 'error'); }
  }

  const updateListing = async (e) => {
    e.preventDefault();
  if(!user){ showFlash('Please login', 'info'); return }
    try{
      const res = await fetch(`/api/roommates/${user.id}/listing`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if(res.ok){ setListing(data.listing); showFlash('Listing updated', 'success'); }
      else showFlash(data.msg || data.error || 'Error', 'error');
    }catch(err){ showFlash('Network error', 'error'); }
  }

  const removeListing = async () => {
  if(!user){ showFlash('Please login', 'info'); return }
  if(!window.confirm('Remove your listing?')) return;
    try{
      const res = await fetch(`/api/roommates/${user.id}/listing`, { method: 'DELETE' });
      if(res.ok){ setListing(null); showFlash('Listing removed', 'success'); }
      else showFlash('Error removing', 'error');
    }catch(err){ showFlash('Network error', 'error'); }
  }

  // open apply modal by dispatching an event (modal handles submission)
  const applyTo = (listing) => {
  if(!user){ showFlash('Please login to apply', 'info'); return }
    const ev = new CustomEvent('openRoommateApplyModal', { detail: { listing, user } });
    window.dispatchEvent(ev);
  }

  const [viewing, setViewing] = useState(null);

  if(loading) return <main className="container py-5">Loading...</main>

  return (
    <main className="container py-5">
      {flash && (
        <div className={`alert ${flash.type === 'error' ? 'alert-danger' : flash.type === 'success' ? 'alert-success' : 'alert-info'}`} role="alert">
          {flash.text}
          <button type="button" className="btn btn-ghost btn-sm float-end" onClick={()=>setFlash(null)}>×</button>
        </div>
      )}
      <h3>Roommates</h3>
      <p className="muted">Find compatible roommates.</p>

      {user ? (
        <div className="card p-3 mb-3">
          <h5>{listing ? 'Edit your Host Listing' : 'Apply as Host'}</h5>
          <form onSubmit={listing ? updateListing : applyAsHost}>
            <input className="form-control mb-2" placeholder="Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
            <input className="form-control mb-2" placeholder="Contact" value={form.contact} onChange={e=>setForm(f=>({...f,contact:e.target.value}))} />
            <input className="form-control mb-2" placeholder="Location" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} />
            <input className="form-control mb-2" placeholder="Rooms available (e.g., 1 room)" value={form.roomsAvailable} onChange={e=>setForm(f=>({...f,roomsAvailable:e.target.value}))} />
            <textarea className="form-control mb-2" placeholder="Details" value={form.details} onChange={e=>setForm(f=>({...f,details:e.target.value}))} />
            <div className="d-flex gap-2">
              <button className="btn btn-primary" type="submit">{listing ? 'Update Listing' : 'Apply as Host'}</button>
              {listing && <button type="button" className="btn btn-outline-danger" onClick={removeListing}>Remove Listing</button>}
            </div>
          </form>
        </div>
      ) : (
        <div className="alert alert-secondary">Login to apply as host.</div>
      )}

      <div className="row g-3">
        {listings.length === 0 ? (
          <div className="col-12"><div className="muted">No listings yet.</div></div>
        ) : (
          listings.map(d => (
            <div className="col-md-6" key={d._id || d.id}>
              <div className="feature-card p-3">
                <h6>{d.name || d.title}</h6>
                {d.location && <div className="muted small">{d.location}</div>}
                <div className="mt-2 d-flex justify-content-between align-items-center">
                  <div className="fw-bold">{d.roomsAvailable ? d.roomsAvailable : ''}</div>
                <div>
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={()=>applyTo(d)}>Apply</button>
                  <button className="btn btn-sm btn-ghost" onClick={()=>setViewing(d)}>View</button>
                </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {viewing && (
        <div className="modal-backdrop p-4" style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1200, background:'transparent' }}>
          <div className="card p-3" style={{ maxWidth:600, width:'90%', boxShadow: '0 12px 30px rgba(0,0,0,0.12)', borderRadius:8 }}>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <h5>{viewing.name}</h5>
              <div>
                <button className="btn btn-sm btn-outline-secondary" onClick={()=>setViewing(null)}>Close</button>
              </div>
            </div>
            <div className="small muted">{viewing.location}</div>
            <div className="mt-2 fw-bold">{viewing.roomsAvailable}</div>
            <p className="mt-2">{viewing.details}</p>
            <div className="d-flex gap-2">
              <a className="btn btn-primary" href={`mailto:${viewing.email}`}>Contact</a>
              <button className="btn btn-outline-primary" onClick={()=>{ setViewing(null); applyTo(viewing); }}>Apply</button>
            </div>
          </div>
        </div>
      )}
  <RoommateApplyModal />
    </main>
  )
}

function RoommateApplyModal(){
  const [visible, setVisible] = useState(false);
  const [listing, setListing] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  useEffect(()=>{
    const handler = (e) => {
      const l = e.detail.listing;
      const u = e.detail.user;
      setListing(l);
      setVisible(true);
      setStatus('');
      if(u){ setName(u.fullName || ''); setEmail(u.email || ''); setContact(u.phone || ''); }
      else { setName(''); setEmail(''); setContact(''); }
      setMessage('');
    }
    window.addEventListener('openRoommateApplyModal', handler);
    return () => window.removeEventListener('openRoommateApplyModal', handler);
  },[])

  const submit = async () => {
    if(!listing) return;
    if(!name || !email) { setStatus('Please provide name and email'); return; }
    setStatus('Submitting...');
    try{
      const body = { listingId: listing._id, applicantId: localStorage.getItem('userId'), name, email, contact, message };
      const res = await fetch('/api/roommates/applied', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if(res.ok){ setStatus('Application submitted'); setTimeout(()=>{ setVisible(false); setStatus(''); }, 1200); }
      else setStatus(data.msg || 'Submission failed');
    }catch(err){ setStatus('Network error'); }
  }

  if(!visible) return null;
  return (
    <div className="modal-backdrop p-4" style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1200, background:'transparent' }}>
      <div className="card p-3" style={{ width:480, maxWidth:'94%', boxShadow: '0 12px 30px rgba(0,0,0,0.12)', borderRadius:8 }}>
        <h5 className="mb-2">Apply for: {listing?.name || listing?.title}</h5>
        <input className="form-control mb-2" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="form-control mb-2" placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="form-control mb-2" placeholder="Your contact (phone)" value={contact} onChange={e=>setContact(e.target.value)} />
        <textarea className="form-control mb-2" placeholder="Message / Profile" value={message} onChange={e=>setMessage(e.target.value)} />
        <div className="d-flex gap-2 justify-content-end">
          <button className="btn btn-secondary" onClick={()=>setVisible(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Submit</button>
        </div>
        {status && <div className="mt-2 small muted">{status}</div>}
      </div>
    </div>
  )
}


