import React, { useState, useEffect } from 'react';
import { getUser } from '../lib/auth';

export default function MaidDetailsModal(){
  const [visible, setVisible] = useState(false);
  const [maid, setMaid] = useState(null);
  const [canViewContact, setCanViewContact] = useState(false);

  useEffect(()=>{
    const handler = async (e) => {
      setMaid(e.detail.maid);
      setVisible(true);
      setCanViewContact(false);
      try{
        const user = getUser();
        if(!user || !user.email || !e.detail.maid?._id) return;
        const res = await fetch(`/api/booked-maids?maidId=${e.detail.maid._id}&email=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        if(Array.isArray(data) && data.length > 0) setCanViewContact(true);
      }catch(err){}
    }
    window.addEventListener('openMaidDetails', handler);
    return () => window.removeEventListener('openMaidDetails', handler);
  },[])

  if(!visible || !maid) return null;

  return (
    <div className="modal-backdrop p-4" style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1300, background:'rgba(0,0,0,0.18)' }}>
      <div className="card p-4 shadow-lg border-0" style={{ width:440, maxWidth:'98%', borderRadius:12, background: 'linear-gradient(135deg, #fff9f6 0%, #f7f3ef 100%)' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-0 fw-bold" style={{color:'#8b5cf6'}}>{maid.name}</h5>
            <div className="small text-muted">{maid.location}</div>
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={()=>setVisible(false)} style={{fontSize:22, lineHeight:1}}>&times;</button>
        </div>

        <div className="mb-3 px-2 py-2 rounded-3" style={{background:'#fff', border:'1px solid #efe7f9'}}>
          <div className="mb-2"><span className="fw-semibold">Hourly rate:</span> {maid.hourlyRate || maid.price}</div>
          {canViewContact ? (
            <div className="mb-2"><span className="fw-semibold">Contact:</span> <span style={{color:'#6b21a8'}}>{maid.contact}</span></div>
          ) : (
            <div className="mb-2"><span className="fw-semibold">Contact:</span> <span className="text-muted">(Contact visible after booking confirmation)</span></div>
          )}
          <div className="mb-2"><span className="fw-semibold">Description:</span> <span style={{color:'#444'}}>{maid.description}</span></div>
        </div>

        <div className="d-flex gap-2 justify-content-end mt-3">
          <button className="btn btn-primary px-4" onClick={() => {
            setVisible(false);
            setTimeout(()=>{
              const ev = new CustomEvent('openMaidApplyModal', { detail: { maid } });
              window.dispatchEvent(ev);
            }, 200);
          }}>Book</button>
          <button className="btn btn-outline-secondary px-4" onClick={()=>setVisible(false)}>Close</button>
        </div>
      </div>
    </div>
  )
}
