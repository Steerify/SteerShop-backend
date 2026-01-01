import { z } from 'zod';
import { OrderStatus } from '../../types';

export const createOrderSchema = z.object({
  body: z.object({
    shopId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
    items: z.array(z.object({
      productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
      quantity: z.number().int().positive(),
    })).min(1, 'Order must have at least one item'),
    customerName: z.string().min(1),
    customerEmail: z.string().email(),
    customerPhone: z.string().min(1),
    deliveryAddress: z.string().min(1),
    deliveryCity: z.string().min(1),
    deliveryState: z.string().min(1),
    deliveryFee: z.number().int().min(0).default(0),
    notes: z.string().optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(OrderStatus),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>['body'];
