import { z } from 'zod';

// SYNC: database/migrations/002_create_cases.js, frontend/src/utils/constants.js
const CASE_TYPES = ['PVP', 'SEAD3', 'INDOC', 'FTRV', 'INTHR', 'SINC', 'SAP', 'TRAIN', 'VAR'];
const CASE_PRIORITIES = ['CRITICAL', 'HIGH', 'NORMAL', 'LOW', 'SURGE'];
const CASE_STATUSES = [
  'RECEIVED', 'ASSIGNED', 'IN_REVIEW', 'ISSUES_IDENTIFIED', 'MEMO_DRAFT',
  'QA_REVIEW', 'QA_REVISION', 'FINAL_REVIEW', 'SUBMITTED', 'ON_HOLD',
  'CLOSED_FAVORABLE', 'CLOSED_UNFAVORABLE', 'CANCELLED',
];
const ISSUE_SEVERITIES = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'ADMINISTRATIVE'];
const COMM_DIRECTIONS = ['Outbound', 'Inbound', 'Internal'];

const uuidParam = z.object({ id: z.string().uuid() });

export const createCaseSchema = z.object({
  body: z.object({
    case_type: z.enum(CASE_TYPES, { message: `Must be one of: ${CASE_TYPES.join(', ')}` }),
    subject_last: z.string().min(1, 'Subject last name is required'),
    subject_init: z.string().min(1).max(1, 'Subject initial must be a single character'),
    subject_first: z.string().optional(),
    priority: z.enum(CASE_PRIORITIES).default('NORMAL'),
    assigned_to: z.string().uuid().optional(),
    received_date: z.string().optional(),
    source: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateStatusSchema = z.object({
  params: uuidParam,
  body: z.object({
    status: z.enum(CASE_STATUSES, { message: `Must be one of: ${CASE_STATUSES.join(', ')}` }),
  }),
});

export const addIssueSchema = z.object({
  params: uuidParam,
  body: z.object({
    category: z.string().min(1),
    description: z.string().min(1),
    severity: z.enum(ISSUE_SEVERITIES).default('MODERATE'),
    guideline: z.string().max(1).optional(),
    subcategory: z.string().optional(),
    mitigation_type: z.string().optional(),
  }),
});

export const addCommSchema = z.object({
  params: uuidParam,
  body: z.object({
    comm_type: z.string().min(1),
    direction: z.enum(COMM_DIRECTIONS),
    subject: z.string().min(1),
    content: z.string().optional(),
  }),
});

export const saveMemoSchema = z.object({
  params: uuidParam,
  body: z.object({ memo_text: z.string().min(1, 'Memo text is required') }),
});

export const caseByIdSchema = z.object({ params: uuidParam });
