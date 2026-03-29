import { z } from 'zod';

const uuidParam = z.object({ id: z.string().uuid() });

export const createCaseSchema = z.object({
  body: z.object({
    case_type: z.string().min(1, 'Case type is required'),
    subject_last: z.string().min(1, 'Subject last name is required'),
    subject_init: z.string().min(1, 'Subject initial is required'),
    subject_first: z.string().optional(),
    priority: z.enum(['ROUTINE', 'PRIORITY', 'IMMEDIATE']).default('ROUTINE'),
    assigned_to: z.string().uuid().optional(),
    receipt_date: z.string().optional(),
    source: z.string().optional(),
  }),
});

export const updateStatusSchema = z.object({
  params: uuidParam,
  body: z.object({ status: z.string().min(1, 'Status is required') }),
});

export const addIssueSchema = z.object({
  params: uuidParam,
  body: z.object({
    category: z.string().min(1),
    description: z.string().min(1),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
    guideline: z.string().optional(),
  }),
});

export const addCommSchema = z.object({
  params: uuidParam,
  body: z.object({
    comm_type: z.string().min(1),
    direction: z.enum(['INBOUND', 'OUTBOUND']),
    subject: z.string().min(1),
    content: z.string().optional(),
  }),
});

export const saveMemoSchema = z.object({
  params: uuidParam,
  body: z.object({ memo_text: z.string().min(1, 'Memo text is required') }),
});

export const caseByIdSchema = z.object({ params: uuidParam });
