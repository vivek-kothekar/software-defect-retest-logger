import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import StatusBadge, { SeverityBadge, PriorityBadge } from '../../components/StatusBadge';
import api from '../../services/api';
import {
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Play,
  Layers,
  User,
  Wrench,
  Check
} from 'lucide-react';

export const RetestPage = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected defect for Re-Test modal
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [form, setForm] = useState({
    result: 'PASS',
    comments: '',
    environment: 'Staging QA Environment'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await api.getRetestQueue();
      setQueue(data);
    } catch (err) {
      setError(err.message || 'Failed to load re-test queue from SQLite.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const openRetestModal = (defect) => {
    setSelectedDefect(defect);
    setForm({
      result: 'PASS',
      comments: '',
      environment: defect.latest_build_version ? `Staging Build v${defect.latest_build_version}` : 'Staging QA Environment'
    });
    setError('');
    setSuccess('');
  };

  const handleRetestSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.comments.trim()) {
      setError('Tester comments are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.submitRetest(selectedDefect.id, form);
      setSuccess(res.message);
      setSelectedDefect(null);
      fetchQueue();
    } catch (err) {
      setError(err.message || 'Failed to submit re-test to SQLite.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header title="QA Re-Test Verification Queue" />
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

        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '20px 24px', margin: 0 }}>
            <div className="card-title">
              <RefreshCw size={18} />
              Defects Waiting for QA Verification (READY_FOR_RETEST)
            </div>
            <span style={{ fontSize: '12px', background: '#f5f3ff', color: '#5b21b6', padding: '4px 10px', borderRadius: '9999px', fontWeight: 700 }}>
              {queue.length} Ready for Re-Test
            </span>
          </div>

          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Defect ID</th>
                  <th>Title</th>
                  <th>Developer</th>
                  <th>Build Version</th>
                  <th>Past Attempts</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      <RefreshCw size={18} className="spin" style={{ display: 'inline', marginRight: '8px' }} />
                      Loading re-test queue from SQLite...
                    </td>
                  </tr>
                ) : queue.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                      <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 10px', display: 'block' }} />
                      <strong>Re-Test Queue is empty!</strong>
                      <p style={{ fontSize: '13px', marginTop: '4px' }}>
                        No defects are currently waiting for re-test verification.
                      </p>
                    </td>
                  </tr>
                ) : (
                  queue.map((defect) => (
                    <tr key={defect.id}>
                      <td className="code-cell">{defect.defect_code}</td>
                      <td style={{ fontWeight: 600, maxWidth: '280px' }}>
                        {defect.title}
                      </td>
                      <td>{defect.developer_name}</td>
                      <td>
                        <span style={{ background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                          v{defect.latest_build_version || '1.0.0'}
                        </span>
                      </td>
                      <td>Attempt #{defect.past_attempts + 1}</td>
                      <td><StatusBadge status={defect.status} /></td>
                      <td>
                        <button
                          onClick={() => openRetestModal(defect)}
                          className="btn btn-primary btn-sm"
                        >
                          <Play size={12} fill="currentColor" />
                          Start Re-Test
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive Re-Test Execution Modal */}
        {selectedDefect && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={18} color="#2563eb" />
                  Execute Re-Test — {selectedDefect.defect_code}
                </h3>
                <button
                  onClick={() => setSelectedDefect(null)}
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRetestSubmit}>
                <div className="modal-body">
                  {/* Defect Summary Info */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '18px' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px', color: '#0f172a' }}>
                      {selectedDefect.title}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '8px' }}>
                      <strong>Latest Developer Fix: </strong> {selectedDefect.latest_fix_description || 'Code fix applied.'}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b' }}>
                      <span><strong>Developer:</strong> {selectedDefect.developer_name}</span>
                      <span><strong>Build:</strong> v{selectedDefect.latest_build_version || '1.0.0'}</span>
                      <span style={{ color: '#2563eb', fontWeight: 700 }}>
                        Attempt #{selectedDefect.past_attempts + 1}
                      </span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Re-Test Result <span className="required">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={form.result}
                      onChange={(e) => setForm({ ...form, result: e.target.value })}
                      required
                    >
                      <option value="PASS">PASS — Verified and resolved (moves to Pending Closure)</option>
                      <option value="FAIL">FAIL — Bug still reproduces (defect REOPENED)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Test Environment
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.environment}
                      onChange={(e) => setForm({ ...form, environment: e.target.value })}
                      placeholder="e.g. Staging QA Build v1.0.1"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      QA Comments & Observations <span className="required">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Detail verification results, browser environment, and confirmation notes..."
                      value={form.comments}
                      onChange={(e) => setForm({ ...form, comments: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setSelectedDefect(null)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    <Check size={16} />
                    {submitting ? 'Recording in SQLite...' : 'Submit Re-Test'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RetestPage;
