import { z } from 'zod';

export const caseIdParamSchema = z.object({
  params: z.object({ caseId: z.string().uuid() }),
});

export const docIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
