
import React, { useState, useEffect } from 'react';
import { getUser } from '../lib/auth';

export default function TuitionDetailsModal() {
  const [visible, setVisible] = useState(false);
  const [tuition, setTuition] = useState(null);
  const [canViewContact, setCanViewContact] = useState(false);

  useEffect(() => {
    const handler = async (e) => {
      setTuition(e.detail.tuition);
      setVisible(true);
      setCanViewContact(false);
      // Check if user has booked this tuition
      try {
        const user = getUser();
        if (!user || !user.email || !e.detail.tuition?._id) return;
        const res = await fetch(`/api/booked-tuitions?tuitionId=${e.detail.tuition._id}&email=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setCanViewContact(true);
      } catch {}
    };
    window.addEventListener('openTuitionDetails', handler);
    return () => window.removeEventListener('openTuitionDetails', handler);
  }, []);

  if (!visible || !tuition) return null;

  return (
    <div className="modal-backdrop p-4" style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1300, background:'rgba(0,0,0,0.18)' }}>
      <div className="card p-4 shadow-lg border-0" style={{ width: 440, maxWidth: '98%', borderRadius: 22, background: 'linear-gradient(135deg, #f5faff 0%, #e3f0fc 100%)' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-0 fw-bold" style={{color:'#2563eb'}}>{tuition.title || tuition.subject}</h5>
            <div className="small text-muted">{new Date(tuition.createdAt).toLocaleDateString()}</div>
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={()=>setVisible(false)} style={{fontSize:22, lineHeight:1}}>&times;</button>
        </div>
        <div className="mb-3 px-2 py-2 rounded-3" style={{background:'#fff', border:'1px solid #e3eaf5'}}>
          <div className="mb-2"><span className="fw-semibold">Subject:</span> {tuition.subject}</div>
          <div className="mb-2"><span className="fw-semibold">Days:</span> {tuition.days}</div>
          <div className="mb-2"><span className="fw-semibold">Location:</span> {tuition.location}</div>
          <div className="mb-2"><span className="fw-semibold">Salary:</span> <span style={{color:'#228be6'}}>{tuition.salary}</span></div>
          {canViewContact ? (
            <div className="mb-2"><span className="fw-semibold">Contact:</span> <span style={{color:'#1971c2'}}>{tuition.contact}</span></div>
          ) : (
            <div className="mb-2"><span className="fw-semibold">Contact:</span> <span className="text-muted">(Contact visible after booking confirmation)</span></div>
          )}
          <div className="mb-2"><span className="fw-semibold">Description:</span> <span style={{color:'#444'}}>{tuition.description}</span></div>
        </div>
        <div className="d-flex gap-2 justify-content-end mt-3">
          <button className="btn btn-primary px-4" onClick={() => {
            setVisible(false);
            setTimeout(() => {
              const ev = new CustomEvent('openApplyModal', { detail: { tuition } });
              window.dispatchEvent(ev);
            }, 200);
          }}>Apply</button>
          <button className="btn btn-outline-secondary px-4" onClick={()=>setVisible(false)}>Close</button>
        </div>
      </div>
    </div>
  );
}
