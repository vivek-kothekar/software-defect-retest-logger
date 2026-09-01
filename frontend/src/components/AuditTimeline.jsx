import React from 'react';
import { Clock, User, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const AuditTimeline = ({ auditLogs = [] }) => {
  if (!auditLogs || auditLogs.length === 0) {
    return (
      <div style={{ color: '#64748b', fontSize: '13px', padding: '12px 0' }}>
        No audit log history recorded yet.
      </div>
    );
  }

  const getActionBadge = (action) => {
    switch (action) {
      case 'DEFECT_CREATED':
        return { label: 'Defect Created', color: '#2563eb', bg: '#eff6ff', icon: AlertCircle };
      case 'FIX_SUBMITTED':
        return { label: 'Developer Fix Submitted', color: '#7c3aed', bg: '#f5f3ff', icon: RefreshCw };
      case 'RETEST_PASSED':
        return { label: 'Re-Test PASSED', color: '#059669', bg: '#ecfdf5', icon: CheckCircle2 };
      case 'RETEST_FAILED':
        return { label: 'Re-Test FAILED', color: '#dc2626', bg: '#fef2f2', icon: XCircle };
      case 'DEFECT_CLOSED':
        return { label: 'Defect Closed by Lead', color: '#0d9488', bg: '#f0fdfa', icon: CheckCircle2 };
      default:
        return { label: action, color: '#475569', bg: '#f8fafc', icon: Clock };
    }
  };

  return (
    <div className="timeline">
      {auditLogs.map((log) => {
        const badge = getActionBadge(log.action);
        const Icon = badge.icon;
        const formattedDate = new Date(log.created_at).toLocaleString([], {
          dateStyle: 'medium',
          timeStyle: 'short'
        });

        return (
          <div key={log.id} className="timeline-item">
            <div className="timeline-dot" style={{ borderColor: badge.color }} />
            <div className="timeline-content">
              <div className="timeline-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.color,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Icon size={12} />
                    {badge.label}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={12} />
                    <strong>{log.user_name}</strong> ({log.user_role})
                  </span>
                </div>
                <span className="timeline-time">
                  {formattedDate}
                </span>
              </div>
              <div className="timeline-body">{log.description}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AuditTimeline;
