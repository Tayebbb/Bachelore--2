import React from 'react';

export default function AdminDashboardModern() {
  return (
    <>
      <section className="grid-two">
        <article className="surface-card">
          <h5 className="mb-2">Verification Queue</h5>
          <p className="text-secondary mb-3">Approve listings, applications, and role-change requests.</p>
          <div className="d-flex gap-2 flex-wrap">
            <button className="btn-gradient">Approve Selected</button>
            <button className="btn-soft">Reject with Note</button>
          </div>
        </article>
        <article className="surface-card">
          <h5 className="mb-2">Announcement Publisher</h5>
          <textarea className="app-input" rows={5} placeholder="Write announcement for all users" />
          <button className="btn-gradient mt-3">Publish</button>
        </article>
      </section>

      <section className="surface-card">
        <h5 className="mb-3">Operational Controls</h5>
        <div className="grid-two">
          <div className="surface-card metric-card">
            <strong>Users Management</strong>
            <p className="text-secondary mb-0">Suspend, reactivate, or promote users.</p>
          </div>
          <div className="surface-card metric-card">
            <strong>Payment Monitoring</strong>
            <p className="text-secondary mb-0">Track failed payments and retry workflow.</p>
          </div>
        </div>
      </section>
    </>
  );
}
