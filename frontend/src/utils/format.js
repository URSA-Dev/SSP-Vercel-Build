export function genId() {
  return '_' + Math.random().toString(36).slice(2, 9);
}

export function currentUserName(user) {
  return user.last_name + ', ' + user.first_initial + '.';
}

export function currentUserInitials(user) {
  return (user.first_initial + user.last_name[0]).toUpperCase();
}

const STATUS_MAP = {
  RECEIVED:            { label: 'Received',            variant: 'gray' },
  ASSIGNED:            { label: 'Assigned',             variant: 'blue' },
  IN_REVIEW:           { label: 'In Review',            variant: 'navy' },
  ISSUES_IDENTIFIED:   { label: 'Issues Identified',    variant: 'amber' },
  MEMO_DRAFT:          { label: 'Memo Draft',           variant: 'violet' },
  QA_REVIEW:           { label: 'QA Review',            variant: 'violet' },
  QA_REVISION:         { label: 'QA Revision',          variant: 'violet' },
  FINAL_REVIEW:        { label: 'Final Review',         variant: 'violet' },
  SUBMITTED:           { label: 'Submitted',            variant: 'green' },
  ON_HOLD:             { label: 'On Hold',              variant: 'gray' },
  CLOSED_FAVORABLE:    { label: 'Closed — Favorable',   variant: 'green' },
  CLOSED_UNFAVORABLE:  { label: 'Closed — Unfavorable', variant: 'red' },
  CANCELLED:           { label: 'Cancelled',            variant: 'gray' },
};

export function statusBadge(status) {
  return STATUS_MAP[status] || { label: status, variant: 'gray' };
}

const PRIORITY_MAP = {
  CRITICAL: { label: 'Critical', variant: 'red' },
  HIGH:     { label: 'High',     variant: 'amber' },
  NORMAL:   { label: 'Normal',   variant: 'gray' },
  LOW:      { label: 'Low',      variant: 'gray' },
  SURGE:    { label: 'Surge',    variant: 'violet' },
};

export function priorityBadge(priority) {
  return PRIORITY_MAP[priority] || { label: priority, variant: 'gray' };
}

const SEVERITY_MAP = {
  CRITICAL:       { label: 'Critical',       variant: 'red' },
  HIGH:           { label: 'High',           variant: 'orange' },
  MODERATE:       { label: 'Moderate',       variant: 'amber' },
  LOW:            { label: 'Low',            variant: 'green' },
  ADMINISTRATIVE: { label: 'Administrative', variant: 'gray' },
};

export function sevBadge(severity) {
  return SEVERITY_MAP[severity] || { label: severity, variant: 'gray' };
}

const DOC_STATUS_MAP = {
  processing: { label: 'Processing', variant: 'violet' },
  awaiting:   { label: 'Awaiting',   variant: 'amber' },
  confirmed:  { label: 'Confirmed',  variant: 'green' },
  failed:     { label: 'Failed',     variant: 'red' },
};

export function docStatusBadge(status) {
  return DOC_STATUS_MAP[status] || { label: status, variant: 'gray' };
}
