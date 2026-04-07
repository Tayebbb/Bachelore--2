import React, { Suspense, lazy, useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import AdminLayout from '../components/admin/AdminLayout.jsx'
import StudentLayout from '../components/student/StudentLayout.jsx'
const PublicHome = lazy(() => import('../pages/PublicHomeModern.jsx'))
const Login = lazy(() => import('../pages/LoginModern.jsx'))
const Signup = lazy(() => import('../pages/SignupModern.jsx'))
const AdminLogin = lazy(() => import('../pages/AdminLoginModern.jsx'))
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage.jsx'))
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage.jsx'))
const AdminCreateListingsPage = lazy(() => import('../pages/admin/AdminCreateListingsPage.jsx'))
const AdminListingsPage = lazy(() => import('../pages/admin/AdminListingsPage.jsx'))
const AdminPaymentsPage = lazy(() => import('../pages/admin/AdminPaymentsPage.jsx'))
const AdminAnnouncementPage = lazy(() => import('../pages/admin/AdminAnnouncementPage.jsx'))
const StudentDashboardPage = lazy(() => import('../pages/student/StudentDashboardPage.jsx'))
const StudentTuitionPage = lazy(() => import('../pages/student/StudentTuitionPage.jsx'))
const StudentMaidsPage = lazy(() => import('../pages/student/StudentMaidsPage.jsx'))
const StudentRoommatesPage = lazy(() => import('../pages/student/StudentRoommatesPage.jsx'))
const StudentHouseRentPage = lazy(() => import('../pages/student/StudentHouseRentPage.jsx'))
const StudentMarketplacePage = lazy(() => import('../pages/student/StudentMarketplacePage.jsx'))
const StudentAnnouncementsPage = lazy(() => import('../pages/student/StudentAnnouncementsPage.jsx'))
const StudentActivitiesPage = lazy(() => import('../pages/student/StudentActivitiesPage.jsx'))
const StudentProfilePage = lazy(() => import('../pages/student/StudentProfilePage.jsx'))
const SubscriptionPage = lazy(() => import('../pages/SubscriptionPage.jsx'))
const NotFound = lazy(() => import('../pages/NotFound.jsx'))

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
    '/student/announcements',
    '/student/activities',
    '/student/profile',
    '/admin/dashboard',
    '/admin/users',
    '/admin/create-listings',
    '/admin/listings',
    '/admin/announcements',
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

  const routeFallback = (
    <div className="panel-empty-state" style={{ padding: '36px', textAlign: 'center', opacity: 0.8 }}>
      Loading...
    </div>
  )

  return (
    <div className="app-layout">
      {!hideGlobalNavbar && <Navbar />}
      <div className="app-content">
        <Suspense fallback={routeFallback}>
        <Routes>
                    <Route path="/subscribe" element={<SubscriptionPage />} />
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
            <Route path="announcements" element={<StudentAnnouncementsPage />} />
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
            <Route path="create-listings" element={<AdminCreateListingsPage />} />
            <Route path="listings" element={<AdminListingsPage />} />
            <Route path="announcements" element={<AdminAnnouncementPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          {/* Backward compatibility redirects */}
          <Route path="/home" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<NotFound/>} />
        </Routes>
        </Suspense>
      </div>
      {/* Public home has its own footer; signup keeps auth layout clean */}
      {!hideGlobalChrome && location.pathname !== '/signup' && <Footer />}
    </div>
  );
}
