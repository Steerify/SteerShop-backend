import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    shopId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID').optional(),
    name: z.string().min(3, 'Product name must be at least 3 characters'),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    price: z.number().int().positive('Price must be positive'),
    compare_price: z.number().int().positive().optional(),
    stock_quantity: z.number().int().min(0).default(0),
    type: z.enum(['PRODUCT', 'SERVICE']).default('PRODUCT'),
    images: z.array(z.object({
      url: z.string().url(),
      alt: z.string().optional(),
      position: z.number().int().min(0).default(0),
    })).optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID').optional(),
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    price: z.number().int().positive().optional(),
    compare_price: z.number().int().positive().optional(),
    stock_quantity: z.number().int().min(0).optional(),
    type: z.enum(['PRODUCT', 'SERVICE']).optional(),
    images: z.array(z.object({
      url: z.string().url(),
      alt: z.string().optional(),
      position: z.number().int().min(0).default(0),
    })).optional(),
    isActive: z.boolean().optional(),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
