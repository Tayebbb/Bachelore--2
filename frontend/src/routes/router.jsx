import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import PublicHome from '../pages/PublicHomeModern.jsx'
import Login from '../pages/LoginModern.jsx'
import Signup from '../pages/SignupModern.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import AdminLogin from '../pages/AdminLoginModern.jsx'
import AdminLayout from '../components/admin/AdminLayout.jsx'
import StudentLayout from '../components/student/StudentLayout.jsx'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx'
import AdminUsersPage from '../pages/admin/AdminUsersPage.jsx'
import AdminListingsPage from '../pages/admin/AdminListingsPage.jsx'
import AdminPaymentsPage from '../pages/admin/AdminPaymentsPage.jsx'
import StudentDashboardPage from '../pages/student/StudentDashboardPage.jsx'
import StudentTuitionPage from '../pages/student/StudentTuitionPage.jsx'
import StudentMaidsPage from '../pages/student/StudentMaidsPage.jsx'
import StudentRoommatesPage from '../pages/student/StudentRoommatesPage.jsx'
import StudentHouseRentPage from '../pages/student/StudentHouseRentPage.jsx'
import StudentMarketplacePage from '../pages/student/StudentMarketplacePage.jsx'
import StudentActivitiesPage from '../pages/student/StudentActivitiesPage.jsx'
import StudentProfilePage from '../pages/student/StudentProfilePage.jsx'
import NotFound from '../pages/NotFound.jsx'

import { isAdminAuthed, isStudentAuthed, onAuthChange, offAuthChange } from '../lib/auth'
import { useLocation } from 'react-router-dom'

export default function Router(){
  const appShellRoutes = new Set([
    '/student/dashboard',
    '/student/tuition',
    '/student/maids',
    '/student/roommates',
    '/student/houserent',
    '/student/marketplace',
    '/student/activities',
    '/student/profile',
    '/admin/dashboard',
    '/admin/users',
    '/admin/listings',
    '/admin/payments',
  ])

  const StudentRoute = ({ children }) => {
    const [authed, setAuthed] = useState(() => isStudentAuthed());
    useEffect(() => {
      const cb = () => setAuthed(isStudentAuthed())
      onAuthChange(cb)
      return () => offAuthChange(cb)
    }, [])
    return authed ? children : <Navigate to="/login" replace />
  }

  const AdminRoute = ({ children }) => {
    const [adminAuthed, setAdminAuthed] = useState(() => isAdminAuthed())
    useEffect(() => {
      const cb = () => setAdminAuthed(isAdminAuthed())
      onAuthChange(cb)
      return () => offAuthChange(cb)
    }, [])
    return adminAuthed ? children : <Navigate to="/admin/login" replace />
  }
  const location = useLocation();
  const hideGlobalChrome = location.pathname === '/'
  const hideGlobalNavbar = hideGlobalChrome || appShellRoutes.has(location.pathname)
  return (
    <div className="app-layout">
      {!hideGlobalNavbar && <Navbar />}
      <div className="app-content">
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/student"
            element={
              <StudentRoute>
                <StudentLayout />
              </StudentRoute>
            }
          >
            <Route path="dashboard" element={<StudentDashboardPage />} />
            <Route path="tuition" element={<StudentTuitionPage />} />
            <Route path="maids" element={<StudentMaidsPage />} />
            <Route path="roommates" element={<StudentRoommatesPage />} />
            <Route path="houserent" element={<StudentHouseRentPage />} />
            <Route path="marketplace" element={<StudentMarketplacePage />} />
            <Route path="activities" element={<StudentActivitiesPage />} />
            <Route path="profile" element={<StudentProfilePage />} />
            <Route index element={<Navigate to="/student/dashboard" replace />} />
          </Route>

          <Route path="/admin/login" element={<AdminLogin/>} />
          <Route path="/admin-login" element={<Navigate to="/admin/login" replace />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="listings" element={<AdminListingsPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          {/* Backward compatibility redirects */}
          <Route path="/home" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<NotFound/>} />
        </Routes>
      </div>
      {/* Public home has its own footer; signup keeps auth layout clean */}
      {!hideGlobalChrome && location.pathname !== '/signup' && <Footer />}
    </div>
  );
}
