import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="surface-card">
      <h4>Route Not Found</h4>
      <p className="text-secondary">The page you requested does not exist.</p>
      <Link to="/" className="btn-gradient">Go Home</Link>
    </div>
  );
}
