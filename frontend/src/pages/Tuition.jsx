import React, { useState, useEffect } from 'react'
import axios from '../components/axios'
import { getUser } from '../lib/auth'
import TuitionDetailsModal from '../components/TuitionDetailsModal.jsx'


export default function Tuition(){
  const [locationFilter, setLocationFilter] = useState('')
  const [tuitions, setTuitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    setLoading(true)
    axios.get('/api/tuitions')
      .then(res => {
        setTuitions(res.data)
        setLoading(false)
      })
      .catch(err => {
        setError('Failed to load tuitions')
        setLoading(false)
      })
  }, [])

  const filtered = tuitions.filter(j => {
    if(!locationFilter) return true
    return j.location?.toLowerCase().includes(locationFilter.trim().toLowerCase())
      || j.subject?.toLowerCase().includes(locationFilter.trim().toLowerCase())
      || j.description?.toLowerCase().includes(locationFilter.trim().toLowerCase())
  })

  return (
    <main className="tuition-page container-fluid py-4">
      <div className="container px-0">
        <div className="d-flex flex-column flex-md-row align-items-start justify-content-between mb-3 px-3">
          <div className="mb-2 mb-md-0">
            <h4 className="mb-0">{filtered.length} offers found</h4>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <input value={locationFilter} onChange={e=>setLocationFilter(e.target.value)} className="form-control form-control-sm" style={{minWidth:200}} placeholder="Filter by location/subject" />
            <button className="btn btn-outline-secondary btn-sm" onClick={()=>setLocationFilter('')}>Clear</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">Loading tuitions...</div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div className="row g-4">
            {filtered.map(job=> (
              <div key={job._id} className="col-md-6">
                <article className="job-card">
                  <div className="job-card-inner">
                    <h5 className="job-title">{job.title || job.subject}</h5>
                    <div className="small muted mb-2">
                      <span><strong>Location:</strong> {job.location}</span>
                      <span className="mx-2">•</span>
                      <span><strong>Salary:</strong> {job.salary}</span>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-primary btn-sm" onClick={() => {
                        const ev = new CustomEvent('openApplyModal', { detail: { tuition: job } });
                        window.dispatchEvent(ev);
                      }}>Apply</button>
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => {
                        const ev = new CustomEvent('openTuitionDetails', { detail: { tuition: job } });
                        window.dispatchEvent(ev);
                      }}>Description</button>
                    </div>
                    {/* Details modal handled globally */}
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </div>

  {/* Modals (global simple implementation) */}
  <ApplyModal />
  <TuitionDetailsModal />
    </main>
  )
}

function ApplyModal(){
  const [visible, setVisible] = useState(false);
  const [tuition, setTuition] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  useEffect(()=>{
    const handler = (e) => {
      const u = getUser();
      setTuition(e.detail.tuition);
      setVisible(true);
      setStatus('');
      if(u){ setName(u.fullName || u.fullname || u.name || ''); setEmail(u.email || ''); setContact(u.phone || u.contact || ''); }
      else { setName(''); setEmail(''); setContact(''); }
    }
    window.addEventListener('openApplyModal', handler);
    return () => window.removeEventListener('openApplyModal', handler);
  },[])

  const submit = async () => {
    if (!tuition) return;
  if (!name || !email || !contact || !message.trim()) { setStatus('Please provide name, email, contact, and profile'); return; }
    setStatus('Submitting...');
    try{
      const res = await axios.post('/api/applied-tuitions', { tuitionId: tuition._id, name, email, contact, message });
      setStatus('Application submitted.');
      setName(''); setEmail(''); setMessage('');
      setContact('');
      setTimeout(()=>{ setVisible(false); setStatus(''); }, 1500);
    }catch(err){ setStatus('Submission failed'); }
  }

  if (!visible) return null;
  return (
    <div className="modal-backdrop p-4" style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1200 }}>
      <div className="card p-3" style={{ width:480, maxWidth:'94%' }}>
        <h5 className="mb-2">Apply for: {tuition?.subject}</h5>
  <input className="form-control mb-2" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
  <input className="form-control mb-2" placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)} />
  <input className="form-control mb-2" placeholder="Your contact (phone)" value={contact} onChange={e=>setContact(e.target.value)} />
  <textarea className="form-control mb-2" placeholder="Profile (required)" value={message} onChange={e=>setMessage(e.target.value)} required />
        <div className="d-flex gap-2 justify-content-end">
          <button className="btn btn-secondary" onClick={()=>setVisible(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Submit</button>
        </div>
        {status && <div className="mt-2 small muted">{status}</div>}
      </div>
    </div>
  )
}
