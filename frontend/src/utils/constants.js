export const CASE_TYPES = [
  { code: 'T1', name: 'Tier 1', desc: 'Low public trust' },
  { code: 'T2', name: 'Tier 2', desc: 'Moderate public trust' },
  { code: 'T3', name: 'Tier 3', desc: 'Secret — Most common' },
  { code: 'T5', name: 'Tier 5', desc: 'Top Secret / SCI' },
  { code: 'PPR', name: 'PPR', desc: 'Periodic review' },
  { code: 'LBI', name: 'LBI', desc: 'Limited background' },
];

export const CASE_STATUSES = [
  'RECEIVED', 'ASSIGNED', 'IN_REVIEW', 'ISSUES_IDENTIFIED', 'MEMO_DRAFT',
  'QA_REVIEW', 'QA_REVISION', 'FINAL_REVIEW', 'SUBMITTED', 'ON_HOLD',
  'CLOSED_FAVORABLE', 'CLOSED_UNFAVORABLE', 'CANCELLED',
];

export const PRIORITIES = ['CRITICAL', 'HIGH', 'NORMAL', 'LOW', 'SURGE'];

export const SEVERITIES = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'ADMINISTRATIVE'];

export const ISSUE_CATEGORIES = [
  { code: 'A', name: 'ALLEGIANCE', label: 'Allegiance to the United States' },
  { code: 'B', name: 'FOREIGN_INFLUENCE', label: 'Foreign Influence' },
  { code: 'C', name: 'FOREIGN_PREFERENCE', label: 'Foreign Preference' },
  { code: 'D', name: 'SEXUAL_BEHAVIOR', label: 'Sexual Behavior' },
  { code: 'E', name: 'PERSONAL_CONDUCT', label: 'Personal Conduct' },
  { code: 'F', name: 'FINANCIAL', label: 'Financial Considerations' },
  { code: 'G', name: 'ALCOHOL', label: 'Alcohol Consumption' },
  { code: 'H', name: 'DRUG_INVOLVEMENT', label: 'Drug Involvement' },
  { code: 'I', name: 'PSYCHOLOGICAL', label: 'Psychological Conditions' },
  { code: 'J', name: 'CRIMINAL_CONDUCT', label: 'Criminal Conduct' },
  { code: 'K', name: 'HANDLING_PROTECTED_INFO', label: 'Handling Protected Information' },
  { code: 'L', name: 'OUTSIDE_ACTIVITIES', label: 'Outside Activities' },
  { code: 'M', name: 'USE_IT_SYSTEMS', label: 'Use of Information Technology' },
];

export const COMM_TYPES = [
  'INITIAL_NOTIFICATION', 'STATUS_UPDATE', 'INFORMATION_REQUEST', 'INFORMATION_RESPONSE',
  'MEMO_TRANSMISSION', 'ESCALATION_NOTICE', 'INTERNAL_NOTE', 'OTHER',
];

export const COMM_DIRECTIONS = ['Outbound', 'Inbound', 'Internal'];

export const DOC_TYPES = [
  'Investigation Report (ROI)', 'Credit Report Summary', 'Questionnaire (SF-86)',
  'Interview Summary', 'National Agency Check', 'Local Agency Check',
  'Reference Check Summary', 'Employment Verification', 'Court Records',
  'Financial Records', 'Other',
];

export const MITIGATION_TYPES = [
  'PASSAGE_OF_TIME', 'TREATMENT_REHABILITATION', 'COUNSELING_COMPLETED',
  'FINANCIAL_REMEDIATION', 'VOLUNTARY_DISCLOSURE', 'ISOLATED_INCIDENT',
  'STABLE_EMPLOYMENT', 'NONE',
];

export const DISPOSITIONS = ['FAVORABLE', 'FAVORABLE_WITH_COMMENT', 'UNFAVORABLE', 'DEFERRED', 'REFERRED'];
