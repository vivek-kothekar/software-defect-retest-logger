import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Bug,
  PlusCircle,
  RefreshCw,
  CheckSquare,
  LogOut,
  ShieldCheck,
  Code2,
  TestTube2
} from 'lucide-react';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'QA_TESTER':
        return { label: 'QA Tester', color: '#38bdf8', icon: TestTube2 };
      case 'DEVELOPER':
        return { label: 'Developer', color: '#a78bfa', icon: Code2 };
      case 'QA_LEAD':
        return { label: 'QA Lead', color: '#34d399', icon: ShieldCheck };
      default:
        return { label: role, color: '#94a3b8', icon: ShieldCheck };
    }
  };

  const roleInfo = getRoleBadge(user?.role);
  const RoleIcon = roleInfo.icon;

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-icon">
          <Bug size={22} strokeWidth={2.5} />
        </div>
        <div>
          <div className="brand-title">Defect Logger</div>
          <div className="brand-sub">Re-Test Execution QA</div>
        </div>
      </div>

      {/* Role Navigation */}
      <nav className="sidebar-nav">
        {user?.role === 'QA_TESTER' && (
          <>
            <div className="nav-label">QA Tester Menu</div>
            <NavLink
              to="/qa/dashboard"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink
              to="/qa/defects"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Bug size={18} />
              Defects
            </NavLink>
            <NavLink
              to="/qa/create-defect"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <PlusCircle size={18} />
              Create Defect
            </NavLink>
            <NavLink
              to="/qa/retest"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <RefreshCw size={18} />
              Re-Test Queue
            </NavLink>
          </>
        )}

        {user?.role === 'DEVELOPER' && (
          <>
            <div className="nav-label">Developer Menu</div>
            <NavLink
              to="/developer/dashboard"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink
              to="/developer/defects"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Bug size={18} />
              Assigned Defects
            </NavLink>
          </>
        )}

        {user?.role === 'QA_LEAD' && (
          <>
            <div className="nav-label">QA Lead Menu</div>
            <NavLink
              to="/lead/dashboard"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink
              to="/lead/defects"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Bug size={18} />
              All Defects
            </NavLink>
            <NavLink
              to="/lead/closure"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <CheckSquare size={18} />
              Closure Approval
            </NavLink>
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="user-badge-mini">
          <div className="user-avatar">
            <RoleIcon size={16} />
          </div>
          <div className="user-info-text">
            <div className="user-name" title={user?.name}>
              {user?.name}
            </div>
            <div className="user-role-tag" style={{ color: roleInfo.color }}>
              {roleInfo.label}
            </div>
          </div>
        </div>

        <button onClick={handleLogout} className="btn-logout" title="Sign out">
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
