import React from 'react';
import AdminListingsPage from './AdminListingsPage.jsx';

export default function AdminTuitionReviewPage() {
  return (
    <AdminListingsPage
      title="Tution Review"
      subtitle="Approve or reject pending tuition listings and requests."
      listingFilterTypes={['tuition']}
      applicationFilterModules={['tuition']}
    />
  );
}
