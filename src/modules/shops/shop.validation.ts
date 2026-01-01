import { z } from 'zod';

export const createShopSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Shop name must be at least 3 characters'),
    slug: z
      .string()
      .min(3)
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    description: z.string().optional(),
    logo: z.string().url().optional(),
    banner: z.string().url().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }),
});

export const updateShopSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    logo: z.string().url().optional(),
    banner: z.string().url().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }),
});

export type CreateShopInput = z.infer<typeof createShopSchema>['body'];
export type UpdateShopInput = z.infer<typeof updateShopSchema>['body'];
