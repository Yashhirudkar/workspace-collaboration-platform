import { z } from 'zod';

export const operationSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.number(),
  operationType: z.enum(['INSERT', 'DELETE', 'UPDATE', 'RESTORE']),
  payload: z.record(z.string(), z.unknown()),
});

export const pushOperationsSchema = z.object({
  operations: z.array(operationSchema).max(100, 'Batch size limit is 100'),
});

export type OperationInput = z.infer<typeof operationSchema>;
export type PushOperationsInput = z.infer<typeof pushOperationsSchema>;
