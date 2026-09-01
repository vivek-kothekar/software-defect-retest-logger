import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Clock, Check, RefreshCw } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const formatStatus = (s) => {
    switch (s) {
      case 'OPEN':
        return { label: 'Open', icon: AlertCircle, className: 'badge-OPEN' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', icon: Clock, className: 'badge-IN_PROGRESS' };
      case 'READY_FOR_RETEST':
        return { label: 'Ready for Re-Test', icon: RefreshCw, className: 'badge-READY_FOR_RETEST' };
      case 'REOPENED':
        return { label: 'Reopened', icon: XCircle, className: 'badge-REOPENED' };
      case 'PENDING_CLOSURE':
        return { label: 'Pending Closure', icon: Clock, className: 'badge-PENDING_CLOSURE' };
      case 'CLOSED':
        return { label: 'Closed', icon: CheckCircle2, className: 'badge-CLOSED' };
      default:
        return { label: s || 'Unknown', icon: AlertCircle, className: 'badge-OPEN' };
    }
  };

  const config = formatStatus(status);
  const Icon = config.icon;

  return (
    <span className={`badge ${config.className}`}>
      <Icon size={12} strokeWidth={2.5} />
      {config.label}
    </span>
  );
};

export const SeverityBadge = ({ severity }) => {
  return (
    <span className={`badge badge-${severity}`}>
      {severity}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  return (
    <span className={`badge badge-${priority}`}>
      {priority}
    </span>
  );
};

export const ResultBadge = ({ result }) => {
  if (result === 'PASS') {
    return (
      <span className="badge badge-pass">
        <Check size={12} strokeWidth={3} />
        PASS
      </span>
    );
  }
  return (
    <span className="badge badge-fail">
      <XCircle size={12} strokeWidth={3} />
      FAIL
    </span>
  );
};

export default StatusBadge;
