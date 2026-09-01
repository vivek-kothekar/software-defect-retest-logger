import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../../components/Header';
import StatusBadge, { SeverityBadge, PriorityBadge, ResultBadge } from '../../components/StatusBadge';
import AuditTimeline from '../../components/AuditTimeline';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Bug,
  ArrowLeft,
  User,
  Calendar,
  Layers,
  Wrench,
  RefreshCw,
  History,
  CheckCircle2,
  AlertCircle,
  CheckSquare
} from 'lucide-react';

export const DefectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Re-Test Modal state for QA Tester
  const [showRetestModal, setShowRetestModal] = useState(false);
  const [retestForm, setRetestForm] = useState({
    result: 'PASS',
    comments: '',
    environment: 'Staging QA Environment'
  });
  const [submittingRetest, setSubmittingRetest] = useState(false);

  // Fix Modal state for Developer
  const [showFixModal, setShowFixModal] = useState(false);
  const [fixForm, setFixForm] = useState({
    root_cause: '',
    fix_description: '',
    build_version: '1.0.1'
  });
  const [submittingFix, setSubmittingFix] = useState(false);

  const fetchDefectDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getDefectById(id);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load defect details from SQLite.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefectDetails();
  }, [id]);

  const handleRetestSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!retestForm.comments.trim()) {
      setError('Comments are required for re-test verification.');
      return;
    }

    try {
      setSubmittingRetest(true);
      const res = await api.submitRetest(data.defect.id, retestForm);
      setSuccess(res.message);
      setShowRetestModal(false);
      fetchDefectDetails();
    } catch (err) {
      setError(err.message || 'Failed to submit re-test.');
    } finally {
      setSubmittingRetest(false);
    }
  };

  const handleFixSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!fixForm.root_cause.trim() || !fixForm.fix_description.trim() || !fixForm.build_version.trim()) {
      setError('All fix details (root cause, description, build version) are required.');
      return;
    }

    try {
      setSubmittingFix(true);
      const res = await api.submitFix(data.defect.id, fixForm);
      setSuccess(res.message);
      setShowFixModal(false);
      fetchDefectDetails();
    } catch (err) {
      setError(err.message || 'Failed to submit fix.');
    } finally {
      setSubmittingFix(false);
    }
  };

  const handleLeadApproveClosure = async () => {
    if (!window.confirm('Are you sure you want to approve closure for this defect?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await api.approveClosure(data.defect.id);
      setSuccess(res.message);
      fetchDefectDetails();
    } catch (err) {
      setError(err.message || 'Failed to approve closure.');
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Defect Details" />
        <div className="content-container" style={{ textAlign: 'center', padding: '60px' }}>
          <RefreshCw size={24} className="spin" style={{ display: 'inline', marginRight: '8px' }} />
          <p style={{ marginTop: '12px', color: '#64748b' }}>Loading defect details from SQLite...</p>
        </div>
      </>
    );
  }

  if (!data || !data.defect) {
    return (
      <>
        <Header title="Defect Details" />
        <div className="content-container">
          <div className="alert alert-danger">Defect not found or access restricted.</div>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </>
    );
  }

  const { defect, fixes, retests, auditLogs } = data;

  return (
    <>
      <Header title={`Defect Details — ${defect.defect_code}`} />
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

        {/* Top Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => navigate(-1)} className="btn btn-outline btn-sm">
            <ArrowLeft size={14} />
            Back to List
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {/* QA Tester Re-Test Action */}
            {user?.role === 'QA_TESTER' && defect.status === 'READY_FOR_RETEST' && (
              <button onClick={() => setShowRetestModal(true)} className="btn btn-primary">
                <RefreshCw size={15} />
                Execute Re-Test
              </button>
            )}

            {/* Developer Fix Action */}
            {user?.role === 'DEVELOPER' && defect.assigned_developer === user.id && ['OPEN', 'IN_PROGRESS', 'REOPENED'].includes(defect.status) && (
              <button onClick={() => setShowFixModal(true)} className="btn btn-primary">
                <Wrench size={15} />
                Submit Fix
              </button>
            )}

            {/* QA Lead Closure Sign-Off */}
            {user?.role === 'QA_LEAD' && defect.status === 'PENDING_CLOSURE' && (
              <button onClick={handleLeadApproveClosure} className="btn btn-success">
                <CheckSquare size={15} />
                Approve Defect Closure
              </button>
            )}
          </div>
        </div>

        {/* Main Defect Overview Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span className="code-cell" style={{ fontSize: '18px', fontWeight: 800 }}>
                  {defect.defect_code}
                </span>
                <StatusBadge status={defect.status} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                {defect.title}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <SeverityBadge severity={defect.severity} />
              <PriorityBadge priority={defect.priority} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
            <div>
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Module</span>
              <div style={{ fontWeight: 600, fontSize: '13.5px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Layers size={14} color="#2563eb" />
                {defect.module}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Assigned Developer</span>
              <div style={{ fontWeight: 600, fontSize: '13.5px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={14} color="#7c3aed" />
                {defect.developer_name} ({defect.developer_email})
              </div>
            </div>
            <div>
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Reported By</span>
              <div style={{ fontWeight: 600, fontSize: '13.5px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={14} color="#059669" />
                {defect.creator_name}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Created Date</span>
              <div style={{ fontWeight: 600, fontSize: '13.5px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={14} color="#64748b" />
                {new Date(defect.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
              Description
            </h3>
            <p style={{ fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {defect.description}
            </p>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
              Steps to Reproduce
            </h3>
            <pre style={{
              background: '#f1f5f9',
              padding: '12px 16px',
              borderRadius: '6px',
              fontFamily: 'inherit',
              fontSize: '13.5px',
              whiteSpace: 'pre-wrap',
              color: '#1e293b',
              border: '1px solid #e2e8f0'
            }}>
              {defect.steps_to_reproduce}
            </pre>
          </div>

          <div className="form-row">
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                Expected Result
              </h3>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '6px', fontSize: '13.5px', color: '#166534' }}>
                {defect.expected_result}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                Actual Result
              </h3>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '6px', fontSize: '13.5px', color: '#991b1b' }}>
                {defect.actual_result}
              </div>
            </div>
          </div>
        </div>

        {/* Developer Fix History Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Wrench size={18} />
              Developer Fix Submissions ({fixes?.length || 0})
            </div>
          </div>
          {fixes && fixes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {fixes.map((fix, idx) => (
                <div key={fix.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#1e293b' }}>
                        Fix #{idx + 1}
                      </span>
                      <span style={{ background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                        Build v{fix.build_version}
                      </span>
                      <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                        by {fix.developer_name}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {new Date(fix.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ fontSize: '12.5px', color: '#475569' }}>Root Cause: </strong>
                    <span style={{ fontSize: '13px', color: '#334155' }}>{fix.root_cause}</span>
                  </div>
                  <div>
                    <strong style={{ fontSize: '12.5px', color: '#475569' }}>Fix Description: </strong>
                    <span style={{ fontSize: '13px', color: '#334155' }}>{fix.fix_description}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#64748b', fontSize: '13px' }}>
              No developer fixes submitted yet.
            </div>
          )}
        </div>

        {/* QA Re-Test History Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <RefreshCw size={18} />
              QA Re-Test Verification History ({retests?.length || 0})
            </div>
          </div>
          {retests && retests.length > 0 ? (
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Attempt #</th>
                    <th>Result</th>
                    <th>Environment</th>
                    <th>Tester Comments</th>
                    <th>Verified By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {retests.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700 }}>Attempt #{r.attempt_number}</td>
                      <td><ResultBadge result={r.result} /></td>
                      <td>{r.environment || 'Staging'}</td>
                      <td style={{ maxWidth: '300px' }}>{r.comments}</td>
                      <td>{r.tester_name}</td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(r.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: '#64748b', fontSize: '13px' }}>
              No QA re-tests executed yet.
            </div>
          )}
        </div>

        {/* Complete Audit History Timeline */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <History size={18} />
              Audit Log History (SQLite)
            </div>
          </div>
          <AuditTimeline auditLogs={auditLogs} />
        </div>

        {/* QA Tester Re-Test Modal */}
        {showRetestModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={18} color="#2563eb" />
                  Execute QA Re-Test for {defect.defect_code}
                </h3>
                <button
                  onClick={() => setShowRetestModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleRetestSubmit}>
                <div className="modal-body">
                  <div className="alert alert-info" style={{ marginBottom: '16px' }}>
                    This will be recorded as <strong>Attempt #{retests.length + 1}</strong> in the SQLite database.
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Re-Test Result <span className="required">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={retestForm.result}
                      onChange={(e) => setRetestForm({ ...retestForm, result: e.target.value })}
                      required
                    >
                      <option value="PASS">PASS — Fix verified and bug resolved</option>
                      <option value="FAIL">FAIL — Bug still reproduces / regressed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Test Environment
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={retestForm.environment}
                      onChange={(e) => setRetestForm({ ...retestForm, environment: e.target.value })}
                      placeholder="e.g. Staging QA Environment v1.0.1"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Tester Verification Comments <span className="required">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Describe what was verified and any findings..."
                      value={retestForm.comments}
                      onChange={(e) => setRetestForm({ ...retestForm, comments: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowRetestModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submittingRetest}>
                    {submittingRetest ? 'Recording in SQLite...' : 'Submit Re-Test Result'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Developer Fix Modal */}
        {showFixModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wrench size={18} color="#7c3aed" />
                  Submit Fix for {defect.defect_code}
                </h3>
                <button
                  onClick={() => setShowFixModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleFixSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">
                      Build Version <span className="required">*</span>
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
                      Root Cause <span className="required">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Explain why the defect occurred..."
                      value={fixForm.root_cause}
                      onChange={(e) => setFixForm({ ...fixForm, root_cause: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Fix Description <span className="required">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Detail the code changes applied to fix this bug..."
                      value={fixForm.fix_description}
                      onChange={(e) => setFixForm({ ...fixForm, fix_description: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowFixModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submittingFix}>
                    {submittingFix ? 'Submitting to SQLite...' : 'Submit Fix for Re-Test'}
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

export default DefectDetails;
