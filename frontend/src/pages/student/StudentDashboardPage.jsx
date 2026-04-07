import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../components/axios.jsx';
import { getSubscriptionActive, getUser, setSubscriptionActive } from '../../lib/auth';
import SubscriptionModal from '../../components/SubscriptionModal.jsx';

export default function StudentDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [requestStatuses, setRequestStatuses] = useState([]);
  const [myAppliedListings, setMyAppliedListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(() => getSubscriptionActive() ?? false);
  const [subscriptionActionLoading, setSubscriptionActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const user = getUser();
  const location = useLocation();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/student/dashboard');
        setOverview(data?.overview || null);
        setRequestStatuses(Array.isArray(data?.requestStatuses) ? data.requestStatuses : []);
        setMyAppliedListings(Array.isArray(data?.myAppliedListings) ? data.myAppliedListings : []);
        setMyListings(Array.isArray(data?.myListingsWithApprovedApplicants) ? data.myListingsWithApprovedApplicants : []);
        const nextSubscribed = Boolean(data?.isSubscribed);
        setIsSubscribed(nextSubscribed);
        setSubscriptionActive(nextSubscribed);
        setError(null);
      } catch (err) {
        console.error('Dashboard load error:', err);
        setOverview(null);
        setRequestStatuses([]);
        setMyAppliedListings([]);
        setMyListings([]);
        if (err.response?.status === 403) {
          setError('Access Denied: You do not have permission to view the student dashboard.');
        } else {
          setError('Failed to load dashboard data. Please try again later.');
        }
      }
    };
    load();
  }, [showSubscriptionModal, location.pathname]);

  const appliedRows = myAppliedListings.length > 0 ? myAppliedListings : requestStatuses;

  const cards = [
    { label: 'Applications', value: overview?.total_applications ?? 0 },
    { label: 'Pending Requests', value: appliedRows.filter((r) => ['pending', 'applied'].includes(String(r.status || '').toLowerCase())).length },
    { label: 'Bookings', value: overview?.total_bookings ?? 0 },
    { label: 'Listings', value: overview?.total_listings ?? 0 },
    { label: 'Payments', value: overview?.total_payments ?? 0 },
  ];

  const pending = appliedRows.filter((r) => ['pending', 'applied'].includes(String(r.status || '').toLowerCase()));
  const approved = appliedRows.filter((r) => {
    const status = String(r.status || '').toLowerCase();
    return status === 'approved' || status === 'booked';
  });

  const getListingTypeLabel = (type) => {
    const labels = {
      roommate: 'Roommate',
      tuition: 'Tuition',
      maid: 'Maid',
      house: 'House Rent',
      marketplace: 'Marketplace'
    };
    return labels[type] || type;
  };

  const unsubscribe = async () => {
    const ok = window.confirm('Are you sure you want to unsubscribe?');
    if (!ok) return;

    try {
      setSubscriptionActionLoading(true);
      await api.post('/api/student/subscription/unsubscribe');
      setIsSubscribed(false);
      setSubscriptionActive(false);
    } catch (err) {
      console.error('Unsubscribe failed:', err);
    } finally {
      setSubscriptionActionLoading(false);
    }
  };

  return (
    <div className="panel-page">
      <SubscriptionModal 
        show={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={() => {
          setIsSubscribed(true);
          setSubscriptionActive(true);
          setShowSubscriptionModal(false);
        }}
      />

      <header className="panel-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="panel-page-title">Welcome, {user?.name || 'Student'}</h2>
            <p className="panel-page-subtitle">Here is your activity and progress overview.</p>
          </div>
          {!isSubscribed && (
            <button
              onClick={() => setShowSubscriptionModal(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.95em'
              }}
            >
              Subscribe Now
            </button>
          )}
        </div>
      </header>

      {error ? (
        <div className="panel-empty-state" style={{ padding: '40px', textAlign: 'center', opacity: 0.8 }}>
          <i className="bi bi-exclamation-octagon" style={{ fontSize: '2rem', color: 'var(--danger)', marginBottom: '1rem', display: 'block' }} />
          <p>{error}</p>
          <button className="btn-primary" onClick={() => window.location.reload()} style={{ marginTop: '16px' }}>
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Subscription Status Alert */}
          <div style={{
            padding: '16px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: isSubscribed ? '#d4edda' : '#f8d7da',
            border: `1px solid ${isSubscribed ? '#c3e6cb' : '#f5c6cb'}`,
            color: isSubscribed ? '#155724' : '#721c24'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 320px' }}>
                <i className={`bi ${isSubscribed ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} style={{ fontSize: '1.5rem', flexShrink: 0 }} />
                <div>
                  <strong>{isSubscribed ? 'Subscription Active' : 'Subscription Inactive'}</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.95em' }}>
                    {isSubscribed
                      ? 'Your subscription is active and you have access to all features.'
                      : 'Upgrade to unlock premium features and post unlimited listings.'}
                  </p>
                </div>
              </div>
              {isSubscribed && (
                <button
                  type="button"
                  onClick={unsubscribe}
                  disabled={subscriptionActionLoading}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid #b02a37',
                    backgroundColor: subscriptionActionLoading ? '#c65d69' : '#dc3545',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: subscriptionActionLoading ? 'not-allowed' : 'pointer',
                    opacity: subscriptionActionLoading ? 0.85 : 1,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {subscriptionActionLoading ? 'Processing...' : 'Unsubscribe'}
                </button>
              )}
            </div>
          </div>

          <div className="panel-grid-cards">
            {cards.map((card) => (
              <div className="panel-metric-card" key={card.label}>
                <div className="panel-metric-label">{card.label}</div>
                <div className="panel-metric-value">{Number(card.value).toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="panel-block" style={{ marginTop: 20 }}>
            <h5 className="panel-block-title">Pending Requests</h5>
            <div className="panel-table-wrap">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Listing</th>
                    <th>Status</th>
                    <th>Applied At</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((row) => (
                    <tr key={`${row.module}-${row.application_id}`}>
                      <td>{row.module}</td>
                      <td>{row.listing_title}</td>
                      <td>{row.status}</td>
                      <td>{row.applied_at ? new Date(row.applied_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                  {pending.length === 0 && (
                    <tr>
                      <td colSpan={4} className="panel-empty">No pending requests.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel-block" style={{ marginTop: 20 }}>
            <h5 className="panel-block-title">Approved Requests</h5>
            <div className="panel-table-wrap">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Listing</th>
                    <th>Status</th>
                    <th>Applied At</th>
                  </tr>
                </thead>
                <tbody>
                  {approved.map((row) => (
                    <tr key={`${row.module}-${row.application_id}`}>
                      <td>{row.module}</td>
                      <td>{row.listing_title}</td>
                      <td>{row.status}</td>
                      <td>{row.applied_at ? new Date(row.applied_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                  {approved.length === 0 && (
                    <tr>
                      <td colSpan={4} className="panel-empty">No approved requests.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Listings with Approved Applicants */}
          <div className="panel-block" style={{ marginTop: 32 }}>
            <h5 className="panel-block-title">My Listings & Approved Applicants</h5>
            {!isSubscribed && myListings.length > 0 && (
              <div style={{
                padding: '12px 16px',
                marginBottom: '16px',
                borderRadius: '6px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                color: '#856404',
                fontSize: '0.95em'
              }}>
                <i className="bi bi-lock-fill" style={{ marginRight: '8px' }} />
                Your listings are locked. Subscribe to unlock and manage them.
              </div>
            )}
            <div className="panel-table-wrap">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Title / Location</th>
                    <th>Price / Rent</th>
                    <th>Status</th>
                    <th>Pending</th>
                    <th>Approved</th>
                    <th>Booked</th>
                    <th>Approved Applicants</th>
                  </tr>
                </thead>
                <tbody>
                  {myListings.length === 0 && (
                    <tr><td colSpan={8} className="panel-empty">No listings posted yet.</td></tr>
                  )}
                  {myListings.map(listing => (
                    <tr key={`${listing.listing_type}-${listing.listing_id}`} style={!isSubscribed ? { opacity: 0.6 } : {}}>
                      <td><strong>{getListingTypeLabel(listing.listing_type)}</strong></td>
                      <td>
                        {isSubscribed ? listing.location : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="bi bi-lock-fill" />
                            <span style={{ textDecoration: 'line-through', color: '#999' }}>
                              {listing.location}
                            </span>
                          </span>
                        )}
                      </td>
                      <td>{listing.rent ? (typeof listing.rent === 'number' ? listing.rent.toLocaleString() : listing.rent) : '-'}</td>
                      <td>{isSubscribed ? listing.status : 'Locked'}</td>
                      <td>{isSubscribed ? Number(listing.applicationCounts?.pending_count || 0) : '-'}</td>
                      <td>{isSubscribed ? Number(listing.applicationCounts?.approved_count || 0) : '-'}</td>
                      <td>{isSubscribed ? Number(listing.applicationCounts?.booked_count || 0) : '-'}</td>
                      <td>
                        {isSubscribed ? (
                          listing.approvedApplicants.length === 0 ? (
                            <span style={{ color: '#aaa' }}>None</span>
                          ) : (
                            <ul style={{ margin: 0, padding: '0 0 0 20px', listStyle: 'disc' }}>
                              {listing.approvedApplicants.map((app, idx) => (
                                <li key={idx}>
                                  <b>{app.applicant_name}</b> ({app.applicant_email})<br/>
                                  <span style={{ fontSize: '0.85em', color: '#888' }}>
                                    Approved: {app.applied_at ? new Date(app.applied_at).toLocaleString() : '-'}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )
                        ) : (
                          <span style={{ color: '#aaa' }}>Locked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
