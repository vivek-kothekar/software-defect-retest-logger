import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import StatusBadge, { SeverityBadge, PriorityBadge } from '../../components/StatusBadge';
import api from '../../services/api';
import {
  Bug,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Eye,
  RefreshCw,
  Search,
  Check
} from 'lucide-react';

export const AssignedDefects = () => {
  const [defects, setDefects] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected defect for Fix submission
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [fixForm, setFixForm] = useState({
    root_cause: '',
    fix_description: '',
    build_version: '1.0.1'
  });
  const [submittingFix, setSubmittingFix] = useState(false);

  // Defect Info drawer/modal
  const [viewDefect, setViewDefect] = useState(null);

  const fetchAssigned = async () => {
    try {
      setLoading(true);
      const data = await api.getDefects({ search });
      setDefects(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch assigned defects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssigned();
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const openFixModal = (defect) => {
    setSelectedDefect(defect);
    setFixForm({
      root_cause: '',
      fix_description: '',
      build_version: defect.latest_build_version ? `1.0.${parseInt(defect.latest_build_version.split('.').pop() || '0', 10) + 1}` : '1.0.1'
    });
    setError('');
    setSuccess('');
  };

  const handleFixSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fixForm.root_cause.trim() || !fixForm.fix_description.trim() || !fixForm.build_version.trim()) {
      setError('All fields (Root Cause, Fix Description, Build Version) are required.');
      return;
    }

    try {
      setSubmittingFix(true);
      const res = await api.submitFix(selectedDefect.id, fixForm);
      setSuccess(res.message || 'Fix submitted successfully. Defect is ready for re-test.');
      setSelectedDefect(null);
      fetchAssigned();
    } catch (err) {
      setError(err.message || 'Failed to submit fix to SQLite.');
    } finally {
      setSubmittingFix(false);
    }
  };

  const openDetails = async (id) => {
    try {
      const res = await api.getDefectById(id);
      setViewDefect(res);
    } catch (err) {
      setError(err.message || 'Could not load defect details.');
    }
  };

  return (
    <>
      <Header title="My Assigned Defects" />
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

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-box">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search assigned defects by ID, title, or module..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Assigned Defects Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Defect ID</th>
                  <th>Title</th>
                  <th>Module</th>
                  <th>Severity</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      <RefreshCw size={18} className="spin" style={{ display: 'inline', marginRight: '8px' }} />
                      Loading assigned defects from SQLite...
                    </td>
                  </tr>
                ) : defects.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No defects found assigned to your developer profile.
                    </td>
                  </tr>
                ) : (
                  defects.map((defect) => (
                    <tr key={defect.id}>
                      <td className="code-cell">{defect.defect_code}</td>
                      <td style={{ fontWeight: 600, maxWidth: '280px' }}>{defect.title}</td>
                      <td>{defect.module}</td>
                      <td><SeverityBadge severity={defect.severity} /></td>
                      <td><PriorityBadge priority={defect.priority} /></td>
                      <td><StatusBadge status={defect.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => openDetails(defect.id)}
                            className="btn btn-outline btn-sm"
                            title="Inspect Defect Info"
                          >
                            <Eye size={13} />
                            View
                          </button>

                          {['OPEN', 'IN_PROGRESS', 'REOPENED'].includes(defect.status) && (
                            <button
                              onClick={() => openFixModal(defect)}
                              className="btn btn-primary btn-sm"
                              title="Submit Code Fix"
                            >
                              <Wrench size={13} />
                              Submit Fix
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Fix Modal */}
        {selectedDefect && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wrench size={18} color="#7c3aed" />
                  Submit Fix — {selectedDefect.defect_code}
                </h3>
                <button
                  onClick={() => setSelectedDefect(null)}
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFixSubmit}>
                <div className="modal-body">
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                      {selectedDefect.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Module: <strong>{selectedDefect.module}</strong> | Current Status: <strong>{selectedDefect.status}</strong>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Build / Release Version <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={fixForm.build_version}
                      onChange={(e) => setFixForm({ ...fixForm, build_version: e.target.value })}
                      placeholder="e.g. 1.0.1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Root Cause Analysis <span className="required">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={fixForm.root_cause}
                      onChange={(e) => setFixForm({ ...fixForm, root_cause: e.target.value })}
                      placeholder="Explain what caused the bug..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Fix Description / Patch Notes <span className="required">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={fixForm.fix_description}
                      onChange={(e) => setFixForm({ ...fixForm, fix_description: e.target.value })}
                      placeholder="Detail the code fix applied to resolve the issue..."
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
                    disabled={submittingFix}
                  >
                    <Check size={16} />
                    {submittingFix ? 'Submitting to SQLite...' : 'Submit Fix for Re-Test'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quick Defect Details Modal */}
        {viewDefect && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '640px' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="code-cell" style={{ fontSize: '16px', fontWeight: 800 }}>
                    {viewDefect.defect.defect_code}
                  </span>
                  <StatusBadge status={viewDefect.defect.status} />
                </div>
                <button
                  onClick={() => setViewDefect(null)}
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
                  {viewDefect.defect.title}
                </h3>

                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ fontSize: '12.5px', color: '#475569' }}>Description:</strong>
                  <p style={{ fontSize: '13.5px', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                    {viewDefect.defect.description}
                  </p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ fontSize: '12.5px', color: '#475569' }}>Steps to Reproduce:</strong>
                  <pre style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                    {viewDefect.defect.steps_to_reproduce}
                  </pre>
                </div>

                <div className="form-row">
                  <div>
                    <strong style={{ fontSize: '12.5px', color: '#166534' }}>Expected Result:</strong>
                    <div style={{ background: '#f0fdf4', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', marginTop: '4px' }}>
                      {viewDefect.defect.expected_result}
                    </div>
                  </div>
                  <div>
                    <strong style={{ fontSize: '12.5px', color: '#991b1b' }}>Actual Result:</strong>
                    <div style={{ background: '#fef2f2', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', marginTop: '4px' }}>
                      {viewDefect.defect.actual_result}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={() => setViewDefect(null)} className="btn btn-secondary">
                  Close
                </button>
                {['OPEN', 'IN_PROGRESS', 'REOPENED'].includes(viewDefect.defect.status) && (
                  <button
                    onClick={() => {
                      const def = viewDefect.defect;
                      setViewDefect(null);
                      openFixModal(def);
                    }}
                    className="btn btn-primary"
                  >
                    <Wrench size={14} />
                    Submit Fix
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AssignedDefects;
