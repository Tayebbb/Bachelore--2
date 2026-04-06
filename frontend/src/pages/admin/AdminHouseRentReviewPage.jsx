import React from 'react';
import AdminListingsPage from './AdminListingsPage.jsx';

export default function AdminHouseRentReviewPage() {
  return (
    <AdminListingsPage
      title="Houserent Review"
      subtitle="Approve or reject pending house rent listings."
      listingFilterTypes={['houserent']}
      applicationFilterModules={[]}
    />
  );
}
