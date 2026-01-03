import { z } from 'zod';

export const createShopSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Shop name must be at least 3 characters'),
    slug: z
      .string()
      .min(3)
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    description: z.string().optional(),
    logo_url: z.string().url().optional().or(z.literal('')),
    banner_url: z.string().url().optional().or(z.literal('')),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    payment_method: z.string().optional(),
    bank_account_name: z.string().optional(),
    bank_name: z.string().optional(),
    bank_account_number: z.string().optional(),
    paystack_public_key: z.string().optional(),
  }),
});

export const updateShopSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    logo_url: z.string().url().optional().or(z.literal('')),
    banner_url: z.string().url().optional().or(z.literal('')),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    payment_method: z.string().optional(),
    bank_account_name: z.string().optional(),
    bank_name: z.string().optional(),
    bank_account_number: z.string().optional(),
    paystack_public_key: z.string().optional(),
  }),
});

export type CreateShopInput = z.infer<typeof createShopSchema>['body'];
export type UpdateShopInput = z.infer<typeof updateShopSchema>['body'];
