
import React from 'react';

export default function ActivityDetailsModal({ show, onClose, item }) {
  if (!show || !item) return null;
  return (
    <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.4)' }} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content activity-modal-card rounded-4 shadow-lg border-0">
          <div className="modal-header bg-light border-0 rounded-top-4">
            <div className="d-flex align-items-center gap-2">
              <span className={`badge bg-${item.status==='booked'?'success':item.status==='applied'?'warning text-dark':'primary'}`}>{item.status}</span>
              <h5 className="modal-title mb-0">{item.type} Details</h5>
            </div>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            <div className="mb-3">
              <div className="fw-bold fs-5 mb-1">{item.title}</div>
              {item.desc && <div className="text-muted mb-2">{item.desc}</div>}
              {item.date && <div className="small text-secondary mb-2">{new Date(item.date).toLocaleString()}</div>}
            </div>
            <div className="row g-2">
              {item.details && Object.entries(item.details).filter(([k,v])=>v!==undefined&&v!=='').map(([key, value]) => {
                const label = key === 'Message' ? 'Profile' : key;
                return (
                  <div className="col-12 col-md-6" key={key}>
                    <div className="border rounded-3 p-2 mb-2 bg-light">
                      <div className="small text-uppercase text-secondary fw-bold">{label}</div>
                      <div className="fw-semibold">{value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="modal-footer border-0 bg-light rounded-bottom-4">
            <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
