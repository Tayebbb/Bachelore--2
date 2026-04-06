import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function AdminListingsPage({
  title = 'Listing Verification',
  subtitle = 'Approve or reject pending listings across all modules.',
  listingFilterTypes = null,
  applicationFilterModules = null,
}) {
  const [listings, setListings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingKey, setActionLoadingKey] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [pendingRes, appsRes] = await Promise.all([
        api.get('/api/admin/listings/pending'),
        api.get('/api/admin/applications'),
      ]);
      setListings(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      setApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
      setError('');
    } catch (err) {
      console.error('Failed to load admin listings:', err);
      setListings([]);
      setApplications([]);
      setError(err?.response?.data?.msg || 'Failed to load listing data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const normalizedListingFilters = Array.isArray(listingFilterTypes)
    ? new Set(listingFilterTypes.map((value) => String(value).toLowerCase()))
    : null;

  const normalizedApplicationFilters = Array.isArray(applicationFilterModules)
    ? new Set(applicationFilterModules.map((value) => String(value).toLowerCase()))
    : null;

  const filteredListings = normalizedListingFilters
    ? listings.filter((row) => normalizedListingFilters.has(String(row.listing_type || '').toLowerCase()))
    : listings;

  const filteredApplications = normalizedApplicationFilters
    ? applications.filter((row) => normalizedApplicationFilters.has(String(row.module || '').toLowerCase()))
    : applications;

  const review = async (listing, decision) => {
    const loadingKey = `listing-${listing.listing_id}-${decision}`;
    setActionMessage('');
    setActionError('');
    setActionLoadingKey(loadingKey);
    try {
      await api.post('/api/admin/listings/review', {
        listingType: listing.listing_type,
        listingId: listing.listing_id,
        decision,
      });
      setActionMessage(`Listing ${decision === 'approved' ? 'approved' : 'rejected'} successfully.`);
      await load();
    } catch (err) {
      console.error('Failed to review listing:', err);
      const msg = err?.response?.data?.msg || 'Failed to review listing.';
      const detail = err?.response?.data?.error;
      setActionError(detail ? `${msg} (${detail})` : msg);
    } finally {
      setActionLoadingKey('');
    }
  };

  const reviewApplication = async (application, decision) => {
    const loadingKey = `application-${application.module}-${application.application_id}-${decision}`;
    setActionMessage('');
    setActionError('');
    setActionLoadingKey(loadingKey);
    try {
      await api.post(`/api/admin/applications/${application.module}/${application.application_id}/review`, {
        decision,
      });
      setActionMessage(`Application ${decision === 'approved' ? 'approved' : 'rejected'} successfully.`);
      await load();
    } catch (err) {
      console.error('Failed to review application:', err);
      const msg = err?.response?.data?.msg || 'Failed to review application.';
      const detail = err?.response?.data?.error;
      setActionError(detail ? `${msg} (${detail})` : msg);
    } finally {
      setActionLoadingKey('');
    }
  };

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">{title}</h2>
        <p className="panel-page-subtitle">{subtitle}</p>
      </header>

      <div className="panel-block">
        {actionMessage && (
          <p style={{ marginBottom: 12, color: 'var(--success)', fontWeight: 600 }}>{actionMessage}</p>
        )}
        {actionError && (
          <p style={{ marginBottom: 12, color: 'var(--danger)', fontWeight: 600 }}>{actionError}</p>
        )}
        {loading && (
          <div style={{ padding: '20px', color: '#999' }}>
            Loading listings...
          </div>
        )}
        {!loading && error && (
          <div style={{ padding: '20px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '6px', color: '#721c24' }}>
            {error}
          </div>
        )}
        {!loading && !error && (
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
                {filteredListings.map((row) => (
                  <tr key={`${row.listing_type}-${row.listing_id}`}>
                    <td>{row.listing_type}</td>
                    <td>{row.title}</td>
                    <td>{row.owner_name}</td>
                    <td><span className="badge-status badge-pending">{row.status}</span></td>
                    <td className="panel-actions">
                      <button
                        type="button"
                        className="panel-btn-sm success"
                        onClick={() => review(row, 'approved')}
                        disabled={actionLoadingKey === `listing-${row.listing_id}-approved`}
                      >
                        {actionLoadingKey === `listing-${row.listing_id}-approved` ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="panel-btn-sm danger"
                        onClick={() => review(row, 'rejected')}
                        disabled={actionLoadingKey === `listing-${row.listing_id}-rejected`}
                      >
                        {actionLoadingKey === `listing-${row.listing_id}-rejected` ? 'Rejecting...' : 'Reject'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredListings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="panel-empty">No pending listings.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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
              {filteredApplications.map((row) => (
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
                        onClick={() => reviewApplication(row, 'approved')}
                        disabled={actionLoadingKey === `application-${row.module}-${row.application_id}-approved`}
                      >
                        {actionLoadingKey === `application-${row.module}-${row.application_id}-approved` ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="panel-btn-sm danger"
                        onClick={() => reviewApplication(row, 'rejected')}
                        disabled={actionLoadingKey === `application-${row.module}-${row.application_id}-rejected`}
                      >
                        {actionLoadingKey === `application-${row.module}-${row.application_id}-rejected` ? 'Rejecting...' : 'Reject'}
                      </button>
                  </td>
                </tr>
              ))}
              {filteredApplications.length === 0 && (
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
