import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    caseId: z.string().uuid('Valid case ID is required'),
    agentType: z.string().min(1, 'Agent type is required'),
    inputPayload: z.record(z.unknown()).default({}),
    priority: z.number().int().min(0).max(10).default(0),
  }),
});

export const submitReviewSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    decision: z.enum(['ACCEPT', 'ACCEPT_WITH_EDITS', 'REJECT', 'ESCALATE']),
    comments: z.string().optional(),
    editsApplied: z.record(z.unknown()).optional(),
    reviewDurationSeconds: z.number().int().positive().optional(),
  }),
});

export const searchKnowledgeSchema = z.object({
  body: z.object({
    query: z.string().min(1, 'Query is required'),
    topK: z.number().int().min(1).max(20).default(5),
    threshold: z.number().min(0).max(1).default(0.7),
  }),
});

export const taskIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const caseIdParamSchema = z.object({
  params: z.object({ caseId: z.string().uuid() }),
});

export const retryTaskSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
