import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState({ title: '', message: '' });
  const [tuition, setTuition] = useState({ title: '', subject: '', days: '', salary: '', location: '', description: '', contact: '' });
  const [maid, setMaid] = useState({ name: '', hourlyRate: '', location: '', description: '', contact: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [applied, setApplied] = useState([])
  const [booked, setBooked] = useState([])
  const [appliedMaids, setAppliedMaids] = useState([])
  const [bookedMaids, setBookedMaids] = useState([])
  const [tuitionsList, setTuitionsList] = useState([])
  const [maidsList, setMaidsList] = useState([])
  const [appliedRoommates, setAppliedRoommates] = useState([])
  const [unverifiedHouseRent, setUnverifiedHouseRent] = useState([])
  const [appliedToHost, setAppliedToHost] = useState([])
  const [bookedRoommates, setBookedRoommates] = useState([])
  const [houseForm, setHouseForm] = useState({ title: '', description: '', location: '', price: '', rooms: '', contact: '' });
   const [roommateForm, setRoommateForm] = useState({ ownerId: '', name: '', email: '', contact: '', location: '', roomsAvailable: '', details: '' });

  // Check admin
  React.useEffect(() => {
    if (localStorage.getItem('isAdmin') !== 'true') {
      navigate('/admin-login');
    }
  }, [navigate]);

  const adminCode = 'choton2025'; // Should match backend

  const handleAnnouncement = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...announcement, adminCode })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Announcement posted!');
        setAnnouncement({ title: '', message: '' });
      } else {
        setError(data.msg || 'Error posting announcement');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleTuition = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    // client-side phone validation: must be 11 digits starting with 01
    const PHONE_RE = /^01\d{9}$/;
    if (!PHONE_RE.test(tuition.contact)) {
      setError('Contact must be an 11-digit phone number starting with 01');
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/tuitions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...tuition, adminCode })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Tuition posted!');
        setTuition({ subject: '', description: '', contact: '' });
      } else {
        setError(data.msg || 'Error posting tuition');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleMaid = async (e) => {
    e.preventDefault();
    setMsg(''); setError('');
    if(!maid.name || !maid.hourlyRate){ setError('Name and hourly rate are required'); return; }
    try{
      const token = localStorage.getItem('adminToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/maids', { method: 'POST', headers, body: JSON.stringify({ ...maid, adminCode }) });
      const data = await res.json();
      if(res.ok){ setMsg('Maid posted!'); setMaid({ name: '', hourlyRate: '', location: '', description: '', contact: '' }); }
      else setError(data.msg || data.error || 'Error posting maid');
    }catch(err){ setError('Network error'); }
  };

  // load applied and booked tuitions for admin
  React.useEffect(() => {
    const load = async () => {
      try{
        const token = localStorage.getItem('adminToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const [aRes, bRes, amRes, bmRes, arRes, uhRes] = await Promise.all([
          fetch('/api/applied-tuitions', { headers }),
          fetch('/api/booked-tuitions', { headers }),
          fetch('/api/applied-maids', { headers }),
          fetch('/api/booked-maids', { headers }),
          fetch('/api/roommates/applied', { headers }),
          fetch('/api/house-rent/admin/unverified', { headers })
        ]);
  const [aJson, bJson, amJson, bmJson, arJson, uhJson, tJson, mJson] = await Promise.all([aRes.json(), bRes.json(), amRes.json(), bmRes.json(), arRes.json(), uhRes.json(), (await fetch('/api/tuitions', { headers })).json(), (await fetch('/api/maids', { headers })).json()]);
  if(aRes.ok) setApplied(aJson);
  if(bRes.ok) setBooked(bJson);
  if(amRes.ok) setAppliedMaids(amJson);
  if(bmRes.ok) setBookedMaids(bmJson);
  if(arRes.ok) setAppliedRoommates(arJson);
  if(uhRes.ok) setUnverifiedHouseRent(uhJson);
  // set lookups for display
  setTuitionsList(Array.isArray(tJson) ? tJson : []);
  setMaidsList(Array.isArray(mJson) ? mJson : []);
        // fetch applications to host listings (applicant + host/listing)
        try{
          const athRes = await fetch('/api/roommates/applied-to-host', { headers });
          if(athRes.ok){ const athJson = await athRes.json(); setAppliedToHost(athJson); }
          // load booked roommates
          const brRes = await fetch('/api/roommates/booked', { headers });
          if(brRes.ok){ const brJson = await brRes.json(); setBookedRoommates(brJson); }
        }catch(e){ console.error('Failed loading applied-to-host', e); }
      }catch(e){ console.error(e); }
    }
    load();
  },[])

  const verifyApplication = async (id) => {
    setMsg(''); setError('');
    try{
      const token = localStorage.getItem('adminToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/applied-tuitions/${id}/verify`, { method: 'POST', headers, body: JSON.stringify({ adminCode }) });
  const data = await res.json();
  if(res.ok){ setMsg('Application verified.'); setApplied(a => a.filter(x=> x._id !== id)); setBooked(b => [data.booked, ...b]); }
  else setError(data.msg || data.error || 'Error verifying');
    }catch(err){ setError('Network error'); }
  }

  const verifyMaidApplication = async (id) => {
    setMsg(''); setError('');
    try{
      const token = localStorage.getItem('adminToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      // ask admin how many hours to mark busy
      const hoursStr = window.prompt('Mark maid busy for how many hours?', '4') || '4';
      const hours = Number(hoursStr) || 4;
      const res = await fetch(`/api/applied-maids/${id}/verify`, { method: 'POST', headers, body: JSON.stringify({ adminCode, hours }) });
      const data = await res.json();
      if(res.ok){ setMsg('Maid booking verified.'); setAppliedMaids(a => a.filter(x=> x._id !== id)); setBookedMaids(b => [data.booked, ...b]); }
      else setError(data.msg || data.error || 'Error verifying');
    }catch(err){ setError('Network error'); }
  }

  const verifyRoommateApplication = async (id) => {
    setMsg(''); setError('');
    try{
      const token = localStorage.getItem('adminToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/roommates/applied/${id}/verify`, { method: 'POST', headers, body: JSON.stringify({ adminCode }) });
      const data = await res.json();
  if(res.ok){ setMsg('Roommate verified and listed.'); setAppliedRoommates(a => a.filter(x=> x._id !== id)); if(data.booked) setBookedRoommates(b => [data.booked, ...b]); }
      else setError(data.msg || data.error || 'Error verifying');
    }catch(err){ setError('Network error'); }
  }

  // verify an application that was submitted to a host listing (creates booked roommate)
  const verifyApplicationToHost = async (id) => {
    setMsg(''); setError('');
    try{
      const token = localStorage.getItem('adminToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/roommates/applied-to-host/${id}/verify`, { method: 'POST', headers, body: JSON.stringify({ adminCode }) });
      const data = await res.json();
      if(res.ok){ setMsg('Application verified.'); setAppliedToHost(a => a.filter(x=> x._id !== id)); setBookedRoommates(b => [data.booked, ...b]); }
      else setError(data.msg || data.error || 'Error verifying');
    }catch(err){ setError('Network error'); }
  }

  const deleteAppliedRoommate = async (id) => {
    try{
      const token = localStorage.getItem('adminToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`/api/roommates/applied/${id}`, { method: 'DELETE', headers });
      if(res.ok) setAppliedRoommates(prev => prev.filter(x=> x._id !== id));
    }catch(e){ console.error(e); }
  }

  const verifyHouseListing = async (id) => {
    setMsg(''); setError('');
    try{
      const token = localStorage.getItem('adminToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/house-rent/admin/${id}/verify`, { method: 'POST', headers, body: JSON.stringify({ adminCode }) });
      const data = await res.json();
      if(res.ok){ setMsg('House listing verified.'); setUnverifiedHouseRent(prev => prev.filter(x=> x._id !== id)); }
      else setError(data.msg || data.error || 'Error verifying');
    }catch(err){ setError('Network error'); }
  }

  const deleteHouseListing = async (id) => {
    try{
      const token = localStorage.getItem('adminToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`/api/house-rent/admin/${id}`, { method: 'DELETE', headers });
      if(res.ok) setUnverifiedHouseRent(prev => prev.filter(x=> x._id !== id));
    }catch(e){ console.error(e); }
  }

  const unbookMaid = async (id) => {
    setMsg(''); setError('');
    try{
      const token = localStorage.getItem('adminToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/booked-maids/${id}/unbook`, { method: 'POST', headers, body: JSON.stringify({ adminCode }) });
      const data = await res.json();
      if(res.ok){ setMsg('Maid is available again.'); setBookedMaids(b => b.filter(x=> x._id !== id)); }
      else setError(data.msg || data.error || 'Error unbooking');
    }catch(err){ setError('Network error'); }
  }

  const unbook = async (id) => {
    setMsg(''); setError('');
    try{
      const token = localStorage.getItem('adminToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/booked-tuitions/${id}/unbook`, { method: 'POST', headers, body: JSON.stringify({ adminCode }) });
      const data = await res.json();
      if(res.ok){ setMsg('Unbooked tuition.'); setBooked(b => b.filter(x=> x._id !== id)); }
      else setError(data.msg || 'Error unbooking');
    }catch(err){ setError('Network error'); }
  }

  try{
    console.log('AdminDashboard render');
    return (
      <div className="container py-5">
      <h2 className="mb-4">Admin Dashboard</h2>
      <button className="btn btn-secondary mb-4" onClick={() => { localStorage.removeItem('isAdmin'); navigate('/admin-login'); }}>Logout</button>
      <div className="row">
        <div className="col-md-6">
          <div className="card p-3 mb-4">
            <h4>Post Announcement</h4>
            <form onSubmit={handleAnnouncement}>
              <input className="form-control mb-2" placeholder="Title" value={announcement.title} onChange={e => setAnnouncement(a => ({ ...a, title: e.target.value }))} required />
              <textarea className="form-control mb-2" placeholder="Message" value={announcement.message} onChange={e => setAnnouncement(a => ({ ...a, message: e.target.value }))} required />
              <button className="btn btn-primary w-100" type="submit">Post</button>
            </form>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card p-3 mb-4">
            <h4>Post Tuition</h4>
            <form onSubmit={handleTuition}>
              <input className="form-control mb-2" placeholder="Title" value={tuition.title} onChange={e => setTuition(t => ({ ...t, title: e.target.value }))} required />
              <input className="form-control mb-2" placeholder="Subject" value={tuition.subject} onChange={e => setTuition(t => ({ ...t, subject: e.target.value }))} required />
              <input className="form-control mb-2" placeholder="Days (e.g., Mon-Wed-Fri)" value={tuition.days} onChange={e => setTuition(t => ({ ...t, days: e.target.value }))} required />
              <input className="form-control mb-2" placeholder="Salary (e.g., 1500 TK)" value={tuition.salary} onChange={e => setTuition(t => ({ ...t, salary: e.target.value }))} required />
              <input className="form-control mb-2" placeholder="Location" value={tuition.location} onChange={e => setTuition(t => ({ ...t, location: e.target.value }))} required />
              <textarea className="form-control mb-2" placeholder="Description" value={tuition.description} onChange={e => setTuition(t => ({ ...t, description: e.target.value }))} required />
              <input type="tel" pattern="01[0-9]{9}" title="11 digits, starting with 01" className="form-control mb-2" placeholder="Contact (11-digit, starts with 01)" value={tuition.contact} onChange={e => setTuition(t => ({ ...t, contact: e.target.value }))} required />
              <div className="form-text mb-2">Enter 11-digit phone number starting with 01 (e.g., 017XXXXXXXX)</div>
              <button className="btn btn-primary w-100" type="submit">Post</button>
            </form>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card p-3 mb-4">
            <h4>Post Maid</h4>
            <form onSubmit={handleMaid}>
              <input className="form-control mb-2" placeholder="Name" value={maid.name} onChange={e => setMaid(m => ({ ...m, name: e.target.value }))} required />
              <input className="form-control mb-2" placeholder="Hourly Rate (e.g., 120 TK/hr)" value={maid.hourlyRate} onChange={e => setMaid(m => ({ ...m, hourlyRate: e.target.value }))} required />
              <input className="form-control mb-2" placeholder="Location" value={maid.location} onChange={e => setMaid(m => ({ ...m, location: e.target.value }))} />
              <textarea className="form-control mb-2" placeholder="Description" value={maid.description} onChange={e => setMaid(m => ({ ...m, description: e.target.value }))} />
              <input className="form-control mb-2" placeholder="Contact" value={maid.contact} onChange={e => setMaid(m => ({ ...m, contact: e.target.value }))} />
              <button className="btn btn-primary w-100" type="submit">Post Maid</button>
            </form>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card p-3 mb-4">
            <h4>Post Listing (House Rent)</h4>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setMsg(''); setError('');
              try{
                const token = localStorage.getItem('adminToken');
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;
                const res = await fetch('/api/house-rent/create', { method: 'POST', headers, body: JSON.stringify({ ...houseForm, ownerId: localStorage.getItem('adminUserId') || '', adminCode }) });
                const data = await res.json();
                if(res.ok){ setMsg('House listing created.'); setHouseForm({ title: '', description: '', location: '', price: '', rooms: '', contact: '' }); setUnverifiedHouseRent(u => [data.listing, ...u]); }
                else setError(data.msg || data.error || 'Error creating listing');
              }catch(err){ setError('Network error'); }
            }}>
              <input className="form-control mb-2" placeholder="Title" value={houseForm.title} onChange={e => setHouseForm(h => ({ ...h, title: e.target.value }))} required />
              <textarea className="form-control mb-2" placeholder="Description" value={houseForm.description} onChange={e => setHouseForm(h => ({ ...h, description: e.target.value }))} />
              <input className="form-control mb-2" placeholder="Location" value={houseForm.location} onChange={e => setHouseForm(h => ({ ...h, location: e.target.value }))} />
              <input className="form-control mb-2" placeholder="Price" value={houseForm.price} onChange={e => setHouseForm(h => ({ ...h, price: e.target.value }))} />
              <input className="form-control mb-2" placeholder="Rooms" value={houseForm.rooms} onChange={e => setHouseForm(h => ({ ...h, rooms: e.target.value }))} />
              <input className="form-control mb-2" placeholder="Contact info" value={houseForm.contact} onChange={e => setHouseForm(h => ({ ...h, contact: e.target.value }))} />
              <button className="btn btn-primary w-100" type="submit">Create</button>
            </form>
          </div>
        </div>
      </div>
      <div className="col-md-6 mt-3">
        <div className="card p-3">
          <h4>Post Roommate Listing (admin)</h4>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setMsg(''); setError('');
            try{
              const token = localStorage.getItem('adminToken');
              const headers = { 'Content-Type': 'application/json' };
              if (token) headers['Authorization'] = `Bearer ${token}`;
              const res = await fetch('/api/roommates/admin/create', { method: 'POST', headers, body: JSON.stringify({ ...roommateForm, adminCode }) });
              const data = await res.json();
              if(res.ok){ setMsg('Roommate listing created.'); setRoommateForm({ ownerId: '', name: '', email: '', contact: '', location: '', roomsAvailable: '', details: '' }); }
              else setError(data.msg || data.error || 'Error creating roommate listing');
            }catch(err){ setError('Network error'); }
          }}>
            <input className="form-control mb-2" placeholder="Owner userId (optional)" value={roommateForm.ownerId} onChange={e => setRoommateForm(r => ({ ...r, ownerId: e.target.value }))} />
            <input className="form-control mb-2" placeholder="Name" value={roommateForm.name} onChange={e => setRoommateForm(r => ({ ...r, name: e.target.value }))} />
            <input className="form-control mb-2" placeholder="Email" value={roommateForm.email} onChange={e => setRoommateForm(r => ({ ...r, email: e.target.value }))} />
            <input className="form-control mb-2" placeholder="Contact" value={roommateForm.contact} onChange={e => setRoommateForm(r => ({ ...r, contact: e.target.value }))} />
                        <input className="form-control mb-2" placeholder="Location" value={roommateForm.location} onChange={e => setRoommateForm(r => ({ ...r, location: e.target.value }))} />
            <input className="form-control mb-2" placeholder="Rooms available" value={roommateForm.roomsAvailable} onChange={e => setRoommateForm(r => ({ ...r, roomsAvailable: e.target.value }))} />
            <textarea className="form-control mb-2" placeholder="Details" value={roommateForm.details} onChange={e => setRoommateForm(r => ({ ...r, details: e.target.value }))} />
            <button className="btn btn-primary w-100" type="submit">Create Roommate Listing</button>
          </form>
        </div>
      </div>
      {(msg || error) && <div className={`alert ${msg ? 'alert-success' : 'alert-danger'} mt-3`}>{msg || error}</div>}
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card p-3">
            <h4>Applied Tuitions</h4>
            {applied.length === 0 ? <div className="muted">No applications</div> : (
              <div className="list-group">
                {applied.map(a => (
                  <div key={a._id} className="list-group-item d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-bold">{a.name} — {a.email}</div>
                      <div className="small muted">Applied for: {(() => {
                        const t = tuitionsList.find(x => String(x._id) === String(a.tuitionId));
                        if(t) return `${t.title || t.subject}`;
                        return a.tuitionId;
                      })()}</div>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-success" onClick={() => verifyApplication(a._id)}>Verify & Book</button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={async ()=>{
                        // allow deleting application if admin wants
                        const token = localStorage.getItem('adminToken');
                        const headers = { 'Content-Type': 'application/json' };
                        if (token) headers['Authorization'] = `Bearer ${token}`;
                        const res = await fetch(`/api/applied-tuitions/${a._id}`, { method: 'DELETE', headers });
                        if(res.ok) setApplied(prev => prev.filter(x=> x._id !== a._id));
                      }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <div className="card p-3">
            <h4>Applied Maids</h4>
            {appliedMaids.length === 0 ? <div className="muted">No applications</div> : (
              <div className="list-group">
                {appliedMaids.map(a => (
                  <div key={a._id} className="list-group-item d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-bold">{a.name} — {a.email}</div>
                      <div className="small muted">Applied for: {(() => {
                        const m = maidsList.find(x => String(x._id) === String(a.maidId));
                        if(m) return `${m.name}`;
                        return a.maidId;
                      })()}</div>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-success" onClick={() => verifyMaidApplication(a._id)}>Verify & Book</button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={async ()=>{
                        const token = localStorage.getItem('adminToken');
                        const headers = { 'Content-Type': 'application/json' };
                        if (token) headers['Authorization'] = `Bearer ${token}`;
                        const res = await fetch(`/api/applied-maids/${a._id}`, { method: 'DELETE', headers });
                        if(res.ok) setAppliedMaids(prev => prev.filter(x=> x._id !== a._id));
                      }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="col-md-6 mt-3">
          <div className="card p-3">
            <h4>Applied Roommates</h4>
            {appliedRoommates.length === 0 ? <div className="muted">No applications</div> : (
              <div className="list-group">
                {appliedRoommates.map(a => (
                  <div key={a._id} className="list-group-item d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-bold">{a.name} — {a.email}</div>
                      <div className="small muted">Applied for Host listing • Location: {a.location}</div>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-success" onClick={() => verifyRoommateApplication(a._id)}>Verify & List</button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => deleteAppliedRoommate(a._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6 mt-3">
          <div className="card p-3">
            <h4>Applications to Host Listings</h4>
            {appliedToHost.length === 0 ? <div className="muted">No applications to host listings</div> : (
              <div className="list-group">
                {appliedToHost.map(a => (
                  <div key={a._id} className="list-group-item d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-bold">Applicant: {a.applicantRef ? a.applicantRef.fullName : a.name} — {a.applicantRef ? a.applicantRef.email : a.email}</div>
                      <div className="small muted">For Host: {a.listingRef && a.listingRef.userRef ? a.listingRef.userRef.fullName : 'Unknown host'} • Location: {a.listingRef ? a.listingRef.location : ''}</div>
                      <div className="mt-2">Message: {a.message}</div>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-success" onClick={async ()=>{ await verifyApplicationToHost(a._id); }}>Mark handled</button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={async ()=>{
                        const token = localStorage.getItem('adminToken');
                        const headers = { 'Content-Type': 'application/json' };
                        if (token) headers['Authorization'] = `Bearer ${token}`;
                        const res = await fetch(`/api/roommates/applied/${a._id}`, { method: 'DELETE', headers });
                        if(res.ok) setAppliedToHost(prev => prev.filter(x=> x._id !== a._id));
                      }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

          <div className="col-md-6 mt-3">
            <div className="card p-3">
              <h4>Booked Roommates</h4>
              {bookedRoommates.length === 0 ? <div className="muted">No booked roommates</div> : (
                <div className="list-group">
                  {bookedRoommates.map(b => (
                    <div key={b._id} className="list-group-item d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-bold">Host: {b.hostName || (b.hostRef && b.hostRef.fullName)} — {b.location}</div>
                        <div className="small muted">Settler: {b.applicantName} ({b.applicantEmail})</div>
                        <div className="mt-2">Message: {b.message}</div>
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-warning" onClick={async ()=>{
                          const token = localStorage.getItem('adminToken');
                          const headers = { 'Content-Type': 'application/json' };
                          if (token) headers['Authorization'] = `Bearer ${token}`;
                          const res = await fetch(`/api/roommates/booked/${b._id}/unbook`, { method: 'POST', headers, body: JSON.stringify({ adminCode }) });
                          if(res.ok) setBookedRoommates(prev => prev.filter(x=> x._id !== b._id));
                        }}>Unbook</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

       
        <div className="col-md-6">
          <div className="card p-3">
            <h4>Booked Tuitions</h4>
            {booked.length === 0 ? <div className="muted">No booked tuitions</div> : (
              <div className="list-group">
                {booked.map(b => (
                  <div key={b._id} className="list-group-item d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-bold">{b.title} — {b.location}</div>
                      <div className="small muted">Booked by: {b.applicantName} ({b.applicantEmail})</div>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-warning" onClick={() => unbook(b._id)}>Unbook</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="col-md-6 mt-3">
          <div className="card p-3">
            <h4>Booked Maids</h4>
            {bookedMaids.length === 0 ? <div className="muted">No booked maids</div> : (
              <div className="list-group">
                {bookedMaids.map(b => (
                  <div key={b._id} className="list-group-item d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-bold">{b.name} — {b.location}</div>
                      <div className="small muted">Booked by: {b.applicantName} ({b.applicantEmail})</div>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-warning" onClick={() => unbookMaid(b._id)}>Unbook</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    );
  }catch(err){
    console.error('AdminDashboard render error', err);
    return (
      <div className="container py-5">
        <h2>Admin Dashboard — render error</h2>
        <pre style={{whiteSpace: 'pre-wrap', color: 'red'}}>{String(err && err.stack ? err.stack : err)}</pre>
      </div>
    )
  }
}

