import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function AdminListingsPage() {
  const [listings, setListings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');

  const load = async () => {
    try {
      setError('');
      const [pendingRes, appsRes] = await Promise.all([
        api.get('/api/admin/listings/pending'),
        api.get('/api/admin/applications'),
      ]);
      setListings(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      setApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
    } catch (err) {
      setListings([]);
      setApplications([]);
      setError(err?.response?.data?.msg || err?.message || 'Failed to load admin requests.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (listing, decision) => {
    const key = `listing-${listing.listing_type}-${listing.listing_id}-${decision}`;
    try {
      setBusyKey(key);
      setMessage('');
      setError('');
      await api.post('/api/admin/listings/review', {
        listingType: listing.listing_type,
        listingId: listing.listing_id,
        decision,
      });
      setMessage(`Listing ${decision} successfully.`);
      await load();
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to review listing.');
    } finally {
      setBusyKey('');
    }
  };

  const reviewApplication = async (application, decision) => {
    const key = `app-${application.module}-${application.application_id}-${decision}`;
    try {
      setBusyKey(key);
      setMessage('');
      setError('');
      await api.post(`/api/admin/applications/${application.module}/${application.application_id}/review`, {
        decision,
      });
      setMessage(`Application ${decision} successfully.`);
      await load();
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to review application.');
    } finally {
      setBusyKey('');
    }
  };

  const isPending = (status) => String(status || '').toLowerCase() === 'pending';

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">Listing Verification</h2>
        <p className="panel-page-subtitle">Approve or reject pending listings across all modules.</p>
      </header>

      {message && <div className="panel-empty" style={{ marginBottom: 12, color: '#a5f3c6' }}>{message}</div>}
      {error && <div className="panel-empty" style={{ marginBottom: 12, color: '#fca5a5' }}>{error}</div>}

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
                      <button
                        type="button"
                        className="panel-btn-sm success"
                        disabled={!isPending(row.status) || busyKey === `listing-${row.listing_type}-${row.listing_id}-approved`}
                        onClick={() => review(row, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="panel-btn-sm danger"
                        disabled={!isPending(row.status) || busyKey === `listing-${row.listing_type}-${row.listing_id}-rejected`}
                        onClick={() => review(row, 'rejected')}
                      >
                        Reject
                      </button>
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
                    <button
                      type="button"
                      className="panel-btn-sm success"
                      disabled={!isPending(row.status) || busyKey === `app-${row.module}-${row.application_id}-approved`}
                      onClick={() => reviewApplication(row, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="panel-btn-sm danger"
                      disabled={!isPending(row.status) || busyKey === `app-${row.module}-${row.application_id}-rejected`}
                      onClick={() => reviewApplication(row, 'rejected')}
                    >
                      Reject
                    </button>
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
