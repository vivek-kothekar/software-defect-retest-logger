import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import StatusBadge, { SeverityBadge, PriorityBadge } from '../../components/StatusBadge';
import api from '../../services/api';
import {
  Bug,
  AlertCircle,
  RefreshCw,
  XCircle,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  Eye
} from 'lucide-react';

export const QADashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentDefects, setRecentDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [statsData, defectsData] = await Promise.all([
          api.getDefectStats(),
          api.getDefects()
        ]);
        setStats(statsData);
        setRecentDefects(defectsData.slice(0, 6)); // Top 6 most recent
      } catch (err) {
        setError(err.message || 'Failed to load dashboard metrics from SQLite database.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <>
      <Header title="QA Tester Dashboard" />
      <div className="content-container">
        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Cards - Derived directly from SQLite */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-box stat-icon-blue">
              <Bug size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Defects</span>
              <span className="stat-value">{stats ? stats.total : '...'}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box stat-icon-amber">
              <AlertCircle size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Open</span>
              <span className="stat-value">{stats ? stats.open : '...'}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box stat-icon-purple">
              <RefreshCw size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Ready for Re-Test</span>
              <span className="stat-value">{stats ? stats.readyForRetest : '...'}</span>
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

          <div className="stat-card">
            <div className="stat-icon-box stat-icon-green">
              <CheckCircle2 size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Closed</span>
              <span className="stat-value">{stats ? stats.closed : '...'}</span>
            </div>
          </div>
        </div>

        {/* Quick Action Shortcuts */}
        <div style={{ display: 'flex', gap: '14px', marginBottom: '24px' }}>
          <Link to="/qa/create-defect" className="btn btn-primary">
            <PlusCircle size={16} />
            Log New Defect
          </Link>
          <Link to="/qa/retest" className="btn btn-secondary">
            <RefreshCw size={16} />
            View Re-Test Queue ({stats ? stats.readyForRetest : 0})
          </Link>
        </div>

        {/* Recent Defects Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Bug size={18} />
              Recent Defects Logged
            </div>
            <Link to="/qa/defects" className="btn btn-outline btn-sm">
              View All Defects
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
                      No defects recorded yet. Click "Log New Defect" to begin.
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
                        <Link to={`/qa/defects/${d.id}`} className="btn btn-outline btn-sm">
                          <Eye size={13} />
                          View
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

export default QADashboard;
