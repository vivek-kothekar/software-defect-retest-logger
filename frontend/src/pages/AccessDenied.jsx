import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const AccessDenied = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleReturn = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    switch (user.role) {
      case 'QA_TESTER':
        navigate('/qa/dashboard');
        break;
      case 'DEVELOPER':
        navigate('/developer/dashboard');
        break;
      case 'QA_LEAD':
        navigate('/lead/dashboard');
        break;
      default:
        navigate('/login');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        maxWidth: '480px',
        textAlign: 'center',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#fef2f2',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <ShieldAlert size={32} />
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
          Access Denied
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
          You do not have the required role permissions to access this page or perform this action.
          Your current role is <strong style={{ color: '#0f172a' }}>{user?.role || 'Guest'}</strong>.
        </p>

        <button onClick={handleReturn} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
          <ArrowLeft size={16} />
          Return to My Dashboard
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;
