import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import StatusBadge, { SeverityBadge, PriorityBadge } from '../../components/StatusBadge';
import api from '../../services/api';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  CheckSquare,
  ArrowRight,
  Eye,
  AlertCircle
} from 'lucide-react';

export const LeadDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentDefects, setRecentDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsData, defectsData] = await Promise.all([
          api.getDefectStats(),
          api.getDefects()
        ]);
        setStats(statsData);
        setRecentDefects(defectsData.slice(0, 6));
      } catch (err) {
        setError(err.message || 'Failed to load QA Lead dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <>
      <Header title="QA Lead Executive Dashboard" />
      <div className="content-container">
        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Lead Metrics - Driven by SQLite */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-box stat-icon-blue">
              <ShieldCheck size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Defects</span>
              <span className="stat-value">{stats ? stats.total : '...'}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box stat-icon-teal">
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Pending Closure</span>
              <span className="stat-value">{stats ? stats.pendingClosure : '...'}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box stat-icon-green">
              <CheckCircle2 size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Closed</span>
              <span className="stat-value">{stats ? stats.closed : '...'}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box stat-icon-red">
              <XCircle size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Reopened</span>
              <span className="stat-value">{stats ? stats.reopened : '...'}</span>
            </div>
          </div>
        </div>

        {/* Quick Closure Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
              Final Closure Verification Queue
            </h2>
            <p style={{ fontSize: '13.5px', color: '#94a3b8' }}>
              Review verified PASS re-test logs and grant official quality closure sign-offs.
            </p>
          </div>
          <Link to="/lead/closure" className="btn btn-primary btn-lg">
            <CheckSquare size={16} />
            Review Pending Closures ({stats ? stats.pendingClosure : 0})
          </Link>
        </div>

        {/* Overview Defects Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShieldCheck size={18} />
              Recent Defect Lifecycles
            </div>
            <Link to="/lead/defects" className="btn btn-outline btn-sm">
              View Complete Defect Directory
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Defect ID</th>
                  <th>Title</th>
                  <th>Module</th>
                  <th>Severity</th>
                  <th>Priority</th>
                  <th>Assigned Dev</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentDefects.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No defects recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentDefects.map((d) => (
                    <tr key={d.id}>
                      <td className="code-cell">{d.defect_code}</td>
                      <td style={{ fontWeight: 600 }}>{d.title}</td>
                      <td>{d.module}</td>
                      <td><SeverityBadge severity={d.severity} /></td>
                      <td><PriorityBadge priority={d.priority} /></td>
                      <td>{d.developer_name}</td>
                      <td><StatusBadge status={d.status} /></td>
                      <td>
                        <Link to={`/lead/defects/${d.id}`} className="btn btn-outline btn-sm">
                          <Eye size={13} />
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeadDashboard;
