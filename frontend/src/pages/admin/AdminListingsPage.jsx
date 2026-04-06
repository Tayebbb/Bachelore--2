import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function AdminListingsPage() {
  const [listings, setListings] = useState([]);
  const [applications, setApplications] = useState([]);

  const load = async () => {
    try {
      const [pendingRes, appsRes] = await Promise.all([
        api.get('/api/admin/listings/pending'),
        api.get('/api/admin/applications'),
      ]);
      setListings(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      setApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
    } catch {
      setListings([]);
      setApplications([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (listing, decision) => {
    try {
      await api.post('/api/admin/listings/review', {
        listingType: listing.listing_type,
        listingId: listing.listing_id,
        decision,
      });
      load();
    } catch {
      // ignore for now
    }
  };

  const reviewApplication = async (application, decision) => {
    try {
      await api.post(`/api/admin/applications/${application.module}/${application.application_id}/review`, {
        decision,
      });
      load();
    } catch {
      // ignore for now
    }
  };

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">Listing Verification</h2>
        <p className="panel-page-subtitle">Approve or reject pending listings across all modules.</p>
      </header>

      <div className="panel-block">
          <div className="panel-table-wrap">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((row) => (
                  <tr key={`${row.listing_type}-${row.listing_id}`}>
                    <td>{row.listing_type}</td>
                    <td>{row.title}</td>
                    <td>{row.owner_name}</td>
                    <td><span className="badge-status badge-pending">{row.status}</span></td>
                    <td className="panel-actions">
                      <button type="button" className="panel-btn-sm success" onClick={() => review(row, 'approved')}>Approve</button>
                      <button type="button" className="panel-btn-sm danger" onClick={() => review(row, 'rejected')}>Reject</button>
                    </td>
                  </tr>
                ))}
                {listings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="panel-empty">No pending listings.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>

      <div className="panel-block" style={{ marginTop: 20 }}>
        <h5 className="panel-block-title">Application Requests</h5>
        <div className="panel-table-wrap">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Module</th>
                <th>Applicant Name</th>
                <th>Email</th>
                <th>Number</th>
                <th>Listing</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((row) => (
                <tr key={`${row.module}-${row.application_id}`}>
                  <td>{row.module}</td>
                  <td>{row.applicant_name}</td>
                  <td>{row.applicant_email}</td>
                  <td>{row.applicant_contact || '-'}</td>
                  <td>{row.listing_title}</td>
                  <td>{row.status}</td>
                  <td className="panel-actions">
                    <button type="button" className="panel-btn-sm success" onClick={() => reviewApplication(row, 'approved')}>Approve</button>
                    <button type="button" className="panel-btn-sm danger" onClick={() => reviewApplication(row, 'rejected')}>Reject</button>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={7} className="panel-empty">No application requests.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
