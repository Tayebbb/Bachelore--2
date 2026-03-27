import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import AppShell from '../components/AppShell.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import TuitionModern from '../pages/TuitionModern.jsx';
import MaidsModern from '../pages/MaidsModern.jsx';
import RoommatesModern from '../pages/RoommatesModern.jsx';
import HouseRentModern from '../pages/HouseRentModern.jsx';
import MarketplaceModern from '../pages/MarketplaceModern.jsx';
import SubscriptionModern from '../pages/SubscriptionModern.jsx';
import AdminDashboardModern from '../pages/AdminDashboardModern.jsx';
import LoginModern from '../pages/LoginModern.jsx';
import SignupModern from '../pages/SignupModern.jsx';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import PublicHomeModern from '../pages/PublicHomeModern.jsx';
import AdminLoginModern from '../pages/AdminLoginModern.jsx';
import BillsModern from '../pages/BillsModern.jsx';
import NotFound from '../pages/NotFound.jsx';

import { isAuthed, offAuthChange, onAuthChange } from '../lib/auth.js';

function PrivateRoute({ children }) {
  const [authed, setAuthed] = useState(() => isAuthed());

  useEffect(() => {
    const cb = () => setAuthed(isAuthed());
    onAuthChange(cb);
    return () => offAuthChange(cb);
  }, []);

  return authed ? children : <Navigate to="/login" replace />;
}

function ShellPage({ children }) {
  return <AppShell>{children}</AppShell>;
}

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<PublicHomeModern />} />
      <Route path="/login" element={<LoginModern />} />
      <Route path="/signup" element={<SignupModern />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin-login" element={<AdminLoginModern />} />

      <Route
        path="/home"
        element={
          <PrivateRoute>
            <ShellPage>
              <Dashboard />
            </ShellPage>
          </PrivateRoute>
        }
      />

      <Route
        path="/tuition"
        element={
          <PrivateRoute>
            <ShellPage>
              <TuitionModern />
            </ShellPage>
          </PrivateRoute>
        }
      />

      <Route
        path="/maids"
        element={
          <PrivateRoute>
            <ShellPage>
              <MaidsModern />
            </ShellPage>
          </PrivateRoute>
        }
      />

      <Route
        path="/roommates"
        element={
          <PrivateRoute>
            <ShellPage>
              <RoommatesModern />
            </ShellPage>
          </PrivateRoute>
        }
      />

      <Route
        path="/houserent"
        element={
          <PrivateRoute>
            <ShellPage>
              <HouseRentModern />
            </ShellPage>
          </PrivateRoute>
        }
      />

      <Route
        path="/marketplace"
        element={
          <PrivateRoute>
            <ShellPage>
              <MarketplaceModern />
            </ShellPage>
          </PrivateRoute>
        }
      />

      <Route
        path="/subscription"
        element={
          <PrivateRoute>
            <ShellPage>
              <SubscriptionModern />
            </ShellPage>
          </PrivateRoute>
        }
      />

      <Route
        path="/bills"
        element={
          <PrivateRoute>
            <ShellPage>
              <BillsModern />
            </ShellPage>
          </PrivateRoute>
        }
      />

      <Route
        path="/admin-dashboard"
        element={
          <PrivateRoute>
            <ShellPage>
              <AdminDashboardModern />
            </ShellPage>
          </PrivateRoute>
        }
      />

      <Route path="*" element={<ShellPage><NotFound /></ShellPage>} />
    </Routes>
  );
}
