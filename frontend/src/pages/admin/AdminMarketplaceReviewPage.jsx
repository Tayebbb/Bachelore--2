import React from 'react';
import AdminListingsPage from './AdminListingsPage.jsx';

export default function AdminMarketplaceReviewPage() {
  return (
    <AdminListingsPage
      title="Marketplace Review"
      subtitle="Approve or reject pending marketplace listings."
      listingFilterTypes={['marketplace']}
      applicationFilterModules={[]}
    />
  );
}
