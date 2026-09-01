import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import AccessDenied from './pages/AccessDenied';

// QA Tester Pages
import QADashboard from './pages/qa/QADashboard';
import DefectList from './pages/qa/DefectList';
import CreateDefect from './pages/qa/CreateDefect';
import DefectDetails from './pages/qa/DefectDetails';
import RetestPage from './pages/qa/RetestPage';

// Developer Pages
import DeveloperDashboard from './pages/developer/DeveloperDashboard';
import AssignedDefects from './pages/developer/AssignedDefects';

// QA Lead Pages
import LeadDashboard from './pages/lead/LeadDashboard';
import ClosureApproval from './pages/lead/ClosureApproval';

// Default home router helper
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'QA_TESTER':
      return <Navigate to="/qa/dashboard" replace />;
    case 'DEVELOPER':
      return <Navigate to="/developer/dashboard" replace />;
    case 'QA_LEAD':
      return <Navigate to="/lead/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* QA Tester Routes */}
          <Route element={<ProtectedRoute allowedRoles={['QA_TESTER']} />}>
            <Route path="/qa/dashboard" element={<QADashboard />} />
            <Route path="/qa/defects" element={<DefectList />} />
            <Route path="/qa/defects/:id" element={<DefectDetails />} />
            <Route path="/qa/create-defect" element={<CreateDefect />} />
            <Route path="/qa/retest" element={<RetestPage />} />
          </Route>

          {/* Developer Routes */}
          <Route element={<ProtectedRoute allowedRoles={['DEVELOPER']} />}>
            <Route path="/developer/dashboard" element={<DeveloperDashboard />} />
            <Route path="/developer/defects" element={<AssignedDefects />} />
            <Route path="/developer/defects/:id" element={<DefectDetails />} />
          </Route>

          {/* QA Lead Routes */}
          <Route element={<ProtectedRoute allowedRoles={['QA_LEAD']} />}>
            <Route path="/lead/dashboard" element={<LeadDashboard />} />
            <Route path="/lead/defects" element={<DefectList />} />
            <Route path="/lead/defects/:id" element={<DefectDetails />} />
            <Route path="/lead/closure" element={<ClosureApproval />} />
          </Route>

          {/* Default fallback */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
