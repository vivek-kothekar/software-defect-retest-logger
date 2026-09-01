import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import StatusBadge, { SeverityBadge, PriorityBadge } from '../../components/StatusBadge';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export const DefectList = () => {
  const [defects, setDefects] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const fetchDefects = async () => {
    try {
      setLoading(true);
      const data = await api.getDefects({
        search,
        status: statusFilter
      });
      setDefects(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch defects from SQLite.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDefects();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const getPageBase = () => {
    if (user?.role === 'QA_LEAD') return '/lead/defects';
    return '/qa/defects';
  };

  return (
    <>
      <Header title="All Defects Directory" />
      <div className="content-container">
        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="toolbar">
          <div className="search-box">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search by Defect ID, Title, or Module..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <Filter size={16} color="#64748b" />
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="READY_FOR_RETEST">Ready for Re-Test</option>
              <option value="REOPENED">Reopened</option>
              <option value="PENDING_CLOSURE">Pending Closure</option>
              <option value="CLOSED">Closed</option>
            </select>

            {user?.role === 'QA_TESTER' && (
              <Link to="/qa/create-defect" className="btn btn-primary">
                <PlusCircle size={15} />
                Create Defect
              </Link>
            )}
          </div>
        </div>

        {/* Defects Table */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-responsive" style={{ border: 'none' }}>
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
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      <RefreshCw size={18} className="spin" style={{ display: 'inline', marginRight: '8px' }} />
                      Loading defects from SQLite...
                    </td>
                  </tr>
                ) : defects.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No matching defects found in the database.
                    </td>
                  </tr>
                ) : (
                  defects.map((defect) => (
                    <tr key={defect.id}>
                      <td className="code-cell">{defect.defect_code}</td>
                      <td style={{ fontWeight: 600, maxWidth: '280px' }}>
                        {defect.title}
                      </td>
                      <td>{defect.module}</td>
                      <td><SeverityBadge severity={defect.severity} /></td>
                      <td><PriorityBadge priority={defect.priority} /></td>
                      <td>{defect.developer_name || 'Unassigned'}</td>
                      <td><StatusBadge status={defect.status} /></td>
                      <td>
                        <Link
                          to={`${getPageBase()}/${defect.id}`}
                          className="btn btn-outline btn-sm"
                        >
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

export default DefectList;
