import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Home from '../pages/Dashboard.jsx'
import PublicHome from '../pages/PublicHomeModern.jsx'
import Login from '../pages/LoginModern.jsx'
import Signup from '../pages/SignupModern.jsx'
import Tuition from '../pages/TuitionModern.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import Subscribe from '../pages/SubscriptionModern.jsx'
import Marketplace from '../pages/MarketplaceModern.jsx'
import Roommates from '../pages/RoommatesModern.jsx'
import Maids from '../pages/MaidsModern.jsx'
import HouseRent from '../pages/HouseRentModern.jsx'
import RoommateListings from '../pages/RoommateListings.jsx'
import AdminLogin from '../pages/AdminLoginModern.jsx'
import AdminDashboard from '../pages/AdminDashboardModern.jsx'
import AnnouncementsAll from '../pages/AnnouncementsAll.jsx'
import AppliedTuitions from '../pages/AppliedTuitions.jsx'
import BookedTuitions from '../pages/BookedTuitions.jsx'
import AppliedMaids from '../pages/AppliedMaids.jsx'
import BookedMaids from '../pages/BookedMaids.jsx'
import AppliedRoommates from '../pages/AppliedRoommates.jsx'
import BookedRoommates from '../pages/BookedRoommates.jsx'
import SubscriptionPayments from '../pages/SubscriptionPayments.jsx'
import UserActivities from '../pages/UserActivities.jsx'
import Profile from '../pages/Profile.jsx'
import NotFound from '../pages/NotFound.jsx'

import { isAuthed, isAdminAuthed, onAuthChange, offAuthChange } from '../lib/auth'
import { useLocation } from 'react-router-dom'

export default function Router(){
  const appShellRoutes = new Set([
    '/home',
    '/tuition',
    '/maids',
    '/roommates',
    '/roommate-listings',
    '/houserent',
    '/marketplace',
    '/subscription',
    '/announcements-all',
    '/applied-tuitions',
    '/booked-tuitions',
    '/admin-dashboard',
  ])

  const PrivateRoute = ({ children }) => {
    const [authed, setAuthed] = useState(() => isAuthed())
    useEffect(() => {
      const cb = () => setAuthed(isAuthed())
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
    return adminAuthed ? children : <Navigate to="/admin-login" replace />
  }
  const location = useLocation();
  const hideGlobalChrome = location.pathname === '/'
  const hideGlobalNavbar = hideGlobalChrome || appShellRoutes.has(location.pathname)
  return (
    <div className="app-layout">
      {!hideGlobalNavbar && <Navbar />}
      <div className="app-content">
        <Routes>
          <Route path="/" element={<PublicHome/>} />
          <Route path="/home" element={<PrivateRoute><Home/></PrivateRoute>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/roommates" element={<PrivateRoute><Roommates/></PrivateRoute>} />
          <Route path="/roommate-listings" element={<PrivateRoute><RoommateListings/></PrivateRoute>} />
          <Route path="/maids" element={<PrivateRoute><Maids/></PrivateRoute>} />
          <Route path="/tuition" element={<PrivateRoute><Tuition/></PrivateRoute>} />
          <Route path="/marketplace" element={<PrivateRoute><Marketplace/></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile/></PrivateRoute>} />
          <Route path="/houserent" element={<PrivateRoute><HouseRent/></PrivateRoute>} />
          <Route path="/subscription" element={<PrivateRoute><Subscribe/></PrivateRoute>} />
          <Route path="/subscription-payments" element={<PrivateRoute><SubscriptionPayments/></PrivateRoute>} />
          <Route path="/activities" element={<PrivateRoute><UserActivities/></PrivateRoute>} />
          <Route path="/applied-tuitions" element={<PrivateRoute><AppliedTuitions/></PrivateRoute>} />
          <Route path="/booked-tuitions" element={<PrivateRoute><BookedTuitions/></PrivateRoute>} />
          <Route path="/applied-maids" element={<PrivateRoute><AppliedMaids/></PrivateRoute>} />
          <Route path="/booked-maids" element={<PrivateRoute><BookedMaids/></PrivateRoute>} />
          <Route path="/applied-roommates" element={<PrivateRoute><AppliedRoommates/></PrivateRoute>} />
          <Route path="/booked-roommates" element={<PrivateRoute><BookedRoommates/></PrivateRoute>} />
          <Route path="/announcements-all" element={<AnnouncementsAll/>} />
          <Route path="/admin-login" element={<AdminLogin/>} />
          <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard/></AdminRoute>} />
          <Route path="*" element={<NotFound/>} />
        </Routes>
      </div>
      {/* Public home has its own footer; signup keeps auth layout clean */}
      {!hideGlobalChrome && location.pathname !== '/signup' && <Footer />}
    </div>
  )
}