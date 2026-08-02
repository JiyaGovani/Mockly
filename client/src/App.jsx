import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Questions from './pages/Questions';
import Practice from './pages/Practice';
import Dashboard from './pages/Dashboard';
import MockInterview from './pages/MockInterview';
import MockScorecard from './pages/MockScorecard';
import PlacementHub from './pages/PlacementHub';
import AptitudeWorkspace from './pages/AptitudeWorkspace';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminQuestions from './pages/admin/AdminQuestions';
import AdminRoles from './pages/admin/AdminRoles';
import AdminUsers from './pages/admin/AdminUsers';


/**
 * ProtectedRoute — redirects to /login when not authenticated.
 * Shows a centered spinner while the auth state is loading.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

/**
 * AdminRoute — redirects non-admin users to /questions.
 */
function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'admin' ? children : <Navigate to="/questions" replace />;
}

/**
 * GuestRoute — redirects to /questions when already authenticated.
 */
function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    );
  }

  if (user) {
    const redirectPath = user.role === 'admin' ? '/admin' : '/questions';
    return <Navigate to={redirectPath} replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/questions"
            element={
              <ProtectedRoute>
                <Questions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice/:id"
            element={
              <ProtectedRoute>
                <Practice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mock/:id"
            element={
              <ProtectedRoute>
                <MockInterview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mock/scorecard/:id"
            element={
              <ProtectedRoute>
                <MockScorecard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/placement"
            element={
              <ProtectedRoute>
                <PlacementHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="/placement/aptitude"
            element={
              <ProtectedRoute>
                <AptitudeWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <AdminRoute>
                <AdminQuestions />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <AdminRoute>
                <AdminRoles />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

