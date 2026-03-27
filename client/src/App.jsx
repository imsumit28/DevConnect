import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import Messages from './pages/Messages';
import OAuthCallback from './pages/OAuthCallback';
import ResetPassword from './pages/ResetPassword';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppErrorBoundary from './components/AppErrorBoundary';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppErrorBoundary>
          <Router>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/post/:id" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/login" element={<Auth />} />
              <Route path="/register" element={<Auth />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
            </Routes>
          </Router>
        </AppErrorBoundary>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
