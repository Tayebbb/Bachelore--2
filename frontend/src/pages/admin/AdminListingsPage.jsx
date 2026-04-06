import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function AdminListingsPage() {
  const [listings, setListings] = useState([]);

  const load = async () => {
    try {
      const { data } = await api.get('/api/admin/listings/pending');
      setListings(Array.isArray(data) ? data : []);
    } catch {
      setListings([]);
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
    </div>
  );
}
