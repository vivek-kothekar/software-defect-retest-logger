import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export const ProtectedRoute = ({ allowedRoles, pageTitle }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
          Loading session...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Outlet />
      </div>
    </div>
  );
};

export default ProtectedRoute;
