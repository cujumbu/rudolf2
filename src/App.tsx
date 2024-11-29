import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedLayout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { TimeClock } from './pages/TimeClock';
import { EmployeeManagementPage } from './pages/EmployeeManagementPage';
import { TimeEntriesPage } from './pages/TimeEntriesPage';
import { useAuthStore } from './stores/authStore';

export const App: React.FC = () => {
  const { user, loading, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D42D27]" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/clock" element={<TimeClock />} />
        
        {/* Protected admin routes */}
        <Route element={<ProtectedLayout />}>
          <Route
            path="/admin"
            element={
              user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/admin/employees"
            element={
              user?.role === 'admin' ? <EmployeeManagementPage /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/admin/time-entries"
            element={
              user?.role === 'admin' ? <TimeEntriesPage /> : <Navigate to="/login" replace />
            }
          />
        </Route>

        {/* Root route */}
        <Route
          path="/"
          element={
            !user ? (
              <Navigate to="/clock" replace />
            ) : user.role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/clock" replace />
            )
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}