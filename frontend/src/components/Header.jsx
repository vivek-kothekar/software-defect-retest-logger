import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, UserCheck } from 'lucide-react';

export const Header = ({ title }) => {
  const { user } = useAuth();

  const getRoleLabel = (role) => {
    switch (role) {
      case 'QA_TESTER':
        return 'QA Tester Workspace';
      case 'DEVELOPER':
        return 'Developer Workspace';
      case 'QA_LEAD':
        return 'QA Lead Management';
      default:
        return 'QA Workspace';
    }
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="page-headline">{title || 'Dashboard'}</h1>
      </div>
      <div className="header-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
          <UserCheck size={16} color="#2563eb" />
          <span>Logged in as: <strong style={{ color: '#0f172a' }}>{user?.email}</strong></span>
          <span style={{
            background: '#f1f5f9',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#475569',
            marginLeft: '4px'
          }}>
            {getRoleLabel(user?.role)}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
