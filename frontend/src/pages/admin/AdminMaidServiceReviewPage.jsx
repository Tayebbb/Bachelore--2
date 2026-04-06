import React from 'react';
import AdminListingsPage from './AdminListingsPage.jsx';

export default function AdminMaidServiceReviewPage() {
  return (
    <AdminListingsPage
      title="Maid Service Review"
      subtitle="Approve or reject pending maid service listings and requests."
      listingFilterTypes={['maid']}
      applicationFilterModules={['maid']}
    />
  );
}
