import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PublicHomeModern() {
  return (
    <div className="auth-wrap" style={{ alignItems: 'stretch' }}>
      <div className="surface-card" style={{ maxWidth: 980, width: '100%' }}>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          Bachelor Life, Fully Orchestrated
        </motion.h1>
        <p className="text-secondary">
          Tuition, maids, roommates, rent, marketplace, subscriptions, and admin monitoring in one platform.
        </p>
        <div className="d-flex gap-2 flex-wrap mt-3">
          <Link className="btn-gradient" to="/signup">Start Free</Link>
          <Link className="btn-soft" to="/login">Login</Link>
          <Link className="btn-soft" to="/admin-login">Admin</Link>
        </div>
      </div>
    </div>
  );
}
