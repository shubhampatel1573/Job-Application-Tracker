/**
 * App.jsx
 * ========
 * Root component that sets up routing, auth context, and toast notifications.
 * All routes are protected except /login and /register.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import AddApplication from './pages/AddApplication';
import EditApplication from './pages/EditApplication';
import ApplicationDetail from './pages/ApplicationDetail';
import Interviews from './pages/Interviews';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';

/**
 * PrivateRoute wraps pages that require authentication.
 * If not logged in, redirect to /login.
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

/**
 * PublicRoute prevents logged-in users from seeing login/register.
 * If already authenticated, redirect to dashboard.
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

    {/* Protected routes — wrapped in DashboardLayout */}
    <Route
      path="/dashboard"
      element={
        <PrivateRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </PrivateRoute>
      }
    />
    <Route
      path="/applications"
      element={
        <PrivateRoute>
          <DashboardLayout>
            <Applications />
          </DashboardLayout>
        </PrivateRoute>
      }
    />
    <Route
      path="/applications/add"
      element={
        <PrivateRoute>
          <DashboardLayout>
            <AddApplication />
          </DashboardLayout>
        </PrivateRoute>
      }
    />
    <Route
      path="/applications/:id/edit"
      element={
        <PrivateRoute>
          <DashboardLayout>
            <EditApplication />
          </DashboardLayout>
        </PrivateRoute>
      }
    />
    <Route
      path="/applications/:id"
      element={
        <PrivateRoute>
          <DashboardLayout>
            <ApplicationDetail />
          </DashboardLayout>
        </PrivateRoute>
      }
    />
    <Route
      path="/interviews"
      element={
        <PrivateRoute>
          <DashboardLayout>
            <Interviews />
          </DashboardLayout>
        </PrivateRoute>
      }
    />
    <Route
      path="/analytics"
      element={
        <PrivateRoute>
          <DashboardLayout>
            <Analytics />
          </DashboardLayout>
        </PrivateRoute>
      }
    />
    <Route
      path="/profile"
      element={
        <PrivateRoute>
          <DashboardLayout>
            <Profile />
          </DashboardLayout>
        </PrivateRoute>
      }
    />

    {/* Default redirect */}
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Global toast notification container */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '10px',
              background: '#1e293b',
              color: '#f8fafc',
              fontSize: '14px',
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
