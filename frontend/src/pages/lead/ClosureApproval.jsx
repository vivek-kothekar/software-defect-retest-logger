import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import StatusBadge, { ResultBadge } from '../../components/StatusBadge';
import api from '../../services/api';
import {
  CheckSquare,
  AlertCircle,
  CheckCircle2,
  Eye,
  RefreshCw,
  User,
  MessageSquareQuote,
  Layers,
  ShieldCheck
} from 'lucide-react';

export const ClosureApproval = () => {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [approvingId, setApprovingId] = useState(null);

  const fetchPendingClosures = async () => {
    try {
      setLoading(true);
      const data = await api.getPendingClosures();
      setPendingList(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch pending closures from SQLite.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingClosures();
  }, []);

  const handleApprove = async (defect) => {
    setError('');
    setSuccess('');

    try {
      setApprovingId(defect.id);
      const res = await api.approveClosure(defect.id);
      setSuccess(res.message || `${defect.defect_code} closed successfully.`);
      fetchPendingClosures();
    } catch (err) {
      setError(err.message || 'Defect cannot be closed without a successful PASS re-test.');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <>
      <Header title="QA Lead Closure Approval Queue" />
      <div className="content-container">
        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '20px 24px', margin: 0 }}>
            <div className="card-title">
              <CheckSquare size={18} />
              Defects Awaiting Final Closure Approval (PENDING_CLOSURE)
            </div>
            <span style={{ fontSize: '12px', background: '#f0fdfa', color: '#0d9488', padding: '4px 10px', borderRadius: '9999px', fontWeight: 700 }}>
              {pendingList.length} Pending Approval
            </span>
          </div>

          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Defect ID</th>
                  <th>Title</th>
                  <th>Assigned Dev</th>
                  <th>Build</th>
                  <th>Re-Test Result</th>
                  <th>Verified Tester</th>
                  <th>QA Comments</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      <RefreshCw size={18} className="spin" style={{ display: 'inline', marginRight: '8px' }} />
                      Loading pending closures from SQLite...
                    </td>
                  </tr>
                ) : pendingList.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                      <ShieldCheck size={36} color="#10b981" style={{ margin: '0 auto 10px', display: 'block' }} />
                      <strong>All Clear! No Pending Closures</strong>
                      <p style={{ fontSize: '13px', marginTop: '4px' }}>
                        All passed defects have received official QA Lead sign-off.
                      </p>
                    </td>
                  </tr>
                ) : (
                  pendingList.map((item) => (
                    <tr key={item.id}>
                      <td className="code-cell">{item.defect_code}</td>
                      <td style={{ fontWeight: 600, maxWidth: '240px' }}>
                        {item.title}
                      </td>
                      <td>{item.developer_name}</td>
                      <td>
                        <span style={{ background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                          v{item.latest_build_version || '1.0.0'}
                        </span>
                      </td>
                      <td>
                        <ResultBadge result={item.latest_retest_result || 'PASS'} />
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                          Attempt #{item.latest_attempt_number || 1}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={13} color="#059669" />
                          <span>{item.tester_name || 'QA Tester'}</span>
                        </div>
                      </td>
                      <td style={{ maxWidth: '280px', fontSize: '12.5px', color: '#334155' }}>
                        "{item.latest_retest_comments || 'No comments provided.'}"
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Link to={`/lead/defects/${item.id}`} className="btn btn-outline btn-sm" title="View Full History">
                            <Eye size={13} />
                          </Link>
                          <button
                            onClick={() => handleApprove(item)}
                            className="btn btn-success btn-sm"
                            disabled={approvingId === item.id}
                            title="Verify and Approve Final Defect Closure"
                          >
                            <CheckCircle2 size={13} />
                            {approvingId === item.id ? 'Closing...' : 'Approve Closure'}
                          </button>
                        </div>
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

export default ClosureApproval;
