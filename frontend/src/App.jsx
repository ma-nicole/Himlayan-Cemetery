import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleBasedRedirect from './components/common/RoleBasedRedirect';

// Import design system
import './styles/design-system.css';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import DashboardPage from './pages/DashboardPage';
import EnhancedDashboardPage from './pages/EnhancedDashboardPage';
import MemberDashboardPage from './pages/MemberDashboardPage';
import BurialRecordsPage from './pages/BurialRecordsPage';
import PlotsPage from './pages/PlotsPage';
import MapPage from './pages/MapPage';
import PublicGravePage from './pages/PublicGravePage';
import PublicSearchPage from './pages/PublicSearchPage'; // NEW: Public search page (no login required)
import MemberSearchPage from './pages/MemberSearchPage';
import MemberMapPage from './pages/MemberMapPage';
import MemberServicesPage from './pages/MemberServicesPage';
import MemberContactPage from './pages/MemberContactPage';
import MyLovedOnesPage from './pages/MyLovedOnesPage';
import ProfilePage from './pages/ProfilePage';
import UserManagementPage from './pages/UserManagementPage';
import AnnouncementManagementPage from './pages/AnnouncementManagementPage';
import ServiceRequestManagementPage from './pages/ServiceRequestManagementPage';
import PaymentManagementPage from './pages/PaymentManagementPage';
import FeedbackManagementPage from './pages/FeedbackManagementPage';
import FeedbackPage from './pages/FeedbackPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import PayDuesPage from './pages/PayDuesPage';
import AuthCallback from './pages/AuthCallback';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          {/* NEW PUBLIC ROUTE: Grave search accessible without login */}
          <Route path="/search" element={<PublicSearchPage />} />
          <Route path="/grave/:code" element={<PublicGravePage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />

          {/* Password Change Route - Protected but accessible when must_change_password is true */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />

          {/* Role-based Dashboard Redirect */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            }
          />

          {/* Admin/Staff Only Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <EnhancedDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/burial-records"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <BurialRecordsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plots"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <PlotsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <MapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <AnnouncementManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/service-requests"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <ServiceRequestManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <PaymentManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/feedback"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <FeedbackManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Member/Visitor Routes */}
          <Route
            path="/member/dashboard"
            element={
              <ProtectedRoute>
                <MemberDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/search"
            element={
              <ProtectedRoute>
                <MemberSearchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/loved-ones"
            element={
              <ProtectedRoute>
                <MyLovedOnesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/map"
            element={
              <ProtectedRoute>
                <MemberMapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/services"
            element={
              <ProtectedRoute>
                <MemberServicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/contact"
            element={
              <ProtectedRoute>
                <MemberContactPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pay-dues"
            element={
              <ProtectedRoute>
                <PayDuesPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
