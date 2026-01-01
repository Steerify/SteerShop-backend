import { z } from 'zod';

export const initializePaymentSchema = z.object({
  body: z.object({
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
  }),
});

export const verifyPaymentSchema = z.object({
  params: z.object({
    reference: z.string().min(1),
  }),
});

export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>['body'];
