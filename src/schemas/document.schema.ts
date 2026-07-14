import { z } from 'zod';

const noHtml = (val: string) => !/<[^>]*>/.test(val);

export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255).refine(noHtml, 'Title must not contain HTML tags'),
  content: z.record(z.string(), z.unknown()).optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).refine(noHtml, 'Title must not contain HTML tags').optional(),
  content: z.record(z.string(), z.unknown()).optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
