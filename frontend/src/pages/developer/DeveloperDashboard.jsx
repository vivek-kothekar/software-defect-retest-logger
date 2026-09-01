import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import StatusBadge, { SeverityBadge, PriorityBadge } from '../../components/StatusBadge';
import api from '../../services/api';
import {
  Code2,
  Clock,
  RefreshCw,
  XCircle,
  Eye,
  AlertCircle,
  Wrench,
  ArrowRight
} from 'lucide-react';

export const DeveloperDashboard = () => {
  const [stats, setStats] = useState(null);
  const [defects, setDefects] = useState([]);
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
        setDefects(defectsData);
      } catch (err) {
        setError(err.message || 'Failed to load developer dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <>
      <Header title="Developer Workspace Dashboard" />
      <div className="content-container">
        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Developer Metrics - SQLite Driven */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-box stat-icon-blue">
              <Code2 size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Assigned Defects</span>
              <span className="stat-value">{stats ? stats.totalAssigned : '...'}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box stat-icon-amber">
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">In Progress / Open</span>
              <span className="stat-value">{stats ? stats.inProgress : '...'}</span>
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
        </div>

        {/* Assigned Defects Summary */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Wrench size={18} />
              My Assigned Defects
            </div>
            <Link to="/developer/defects" className="btn btn-outline btn-sm">
              Manage All Assigned
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
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      Loading assigned defects...
                    </td>
                  </tr>
                ) : defects.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No defects are currently assigned to your developer account.
                    </td>
                  </tr>
                ) : (
                  defects.slice(0, 5).map((defect) => (
                    <tr key={defect.id}>
                      <td className="code-cell">{defect.defect_code}</td>
                      <td style={{ fontWeight: 600 }}>{defect.title}</td>
                      <td>{defect.module}</td>
                      <td><SeverityBadge severity={defect.severity} /></td>
                      <td><PriorityBadge priority={defect.priority} /></td>
                      <td><StatusBadge status={defect.status} /></td>
                      <td>
                        <Link to={`/developer/defects`} className="btn btn-outline btn-sm">
                          <Eye size={13} />
                          Details & Fix
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

export default DeveloperDashboard;
