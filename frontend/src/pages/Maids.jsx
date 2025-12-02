import React, { useEffect, useState } from 'react'
import { MAIDS_SAMPLE as sampleMaids } from '../data/samples'
import { getUser } from '../lib/auth'
import MaidDetailsModal from '../components/MaidDetailsModal'

export default function Maids(){
  const [maids, setMaids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try{
        const res = await fetch('/api/maids');
        if(res.ok){
          const data = await res.json();
          setMaids(data);
        } else {
          setMaids(sampleMaids);
        }
      }catch(e){
        setMaids(sampleMaids);
      }finally{ setLoading(false); }
    }
    load();
  }, []);

  // open details modal
  const openDetails = (m) => {
    const ev = new CustomEvent('openMaidDetails', { detail: { maid: m } });
    window.dispatchEvent(ev);
  }

  // open apply modal (booking form)
  const openApply = (m) => {
    const ev = new CustomEvent('openMaidApplyModal', { detail: { maid: m } });
    window.dispatchEvent(ev);
  }

  return (
    <main className="container py-5">
      <h3>Maids</h3>
      <p className="muted">Book trusted home help.</p>
      {loading ? <div className="muted">Loading...</div> : null}
      <div className="row g-3">
        {(maids || []).map((m, idx) => (
          <div className="col-md-6" key={m._id || m.id || idx}>
            <div className="feature-card p-3 d-flex align-items-start gap-3">
              <div style={{width:56, height:56, display:'flex', alignItems:'center', justifyContent:'center'}}>
                <i className="bi-bucket fs-3 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h6 className="mb-0">{m.name}</h6>
                <div className="muted small">{m.location} {m.description ? '• ' + m.description : ''}</div>
                <div className="mt-2 d-flex align-items-center gap-3">
                  <div className="fw-bold">{m.hourlyRate || m.price || ''} Tk / hr</div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => openDetails(m)}>Details</button>
                    <button className="btn hero-cta btn-sm" style={{padding:'.45rem .9rem'}} onClick={() => openApply(m)}>Book</button>
                  </div>
                </div>
                {m.contact ? <div className="small muted mt-1">Contact: {m.contact}</div> : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Global modals for maid details and booking form */}
      <MaidApplyModal />
      <MaidDetailsModal />
    </main>
  )
}

function MaidApplyModal(){
  const [visible, setVisible] = useState(false);
  const [maid, setMaid] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  useEffect(()=>{
    const handler = (e) => {
      const u = getUser();
      setMaid(e.detail.maid);
      setVisible(true);
      setStatus('');
      if(u){ setName(u.fullName || u.fullname || u.name || ''); setEmail(u.email || ''); setContact(u.phone || u.contact || ''); }
      else { setName(''); setEmail(''); setContact(''); }
      setMessage('');
    }
    window.addEventListener('openMaidApplyModal', handler);
    return () => window.removeEventListener('openMaidApplyModal', handler);
  },[])

  const submit = async () => {
    if(!maid || !maid._id){ alert('This maid is a sample/mock entry and cannot be booked. Create a real maid from Admin first.'); return; }
    if (!name || !email || !contact) { setStatus('Please provide name, email and contact'); return; }
    setStatus('Submitting...');
    try{
      const res = await fetch('/api/applied-maids', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ maidId: maid._id, name, email, contact, message }) });
      const data = await res.json();
      if(res.ok){ setStatus('Booking request submitted. Admin will review it.'); setTimeout(()=>{ setVisible(false); setStatus(''); }, 1500); }
      else { setStatus(data.msg || data.error || 'Submission failed'); }
    }catch(err){ setStatus('Network error'); }
  }

  if(!visible) return null;
  return (
    <div className="modal-backdrop p-4" style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1300, background:'rgba(0,0,0,0.18)' }}>
      <div className="card p-3 shadow-lg border-0" style={{ width:480, maxWidth:'94%', borderRadius:10 }}>
        <h5 className="mb-2">Book: {maid?.name}</h5>
        <input className="form-control mb-2" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="form-control mb-2" placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="form-control mb-2" placeholder="Your contact (phone)" value={contact} onChange={e=>setContact(e.target.value)} />
        <textarea className="form-control mb-2" placeholder="Message / notes (optional)" value={message} onChange={e=>setMessage(e.target.value)} />
        <div className="d-flex gap-2 justify-content-end">
          <button className="btn btn-secondary" onClick={()=>setVisible(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Submit</button>
        </div>
        {status && <div className="mt-2 small muted">{status}</div>}
      </div>
    </div>
  )
}
