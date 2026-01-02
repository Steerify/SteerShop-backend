import { z } from 'zod';

export const onboardingSchema = z.object({
  body: z.object({
    businessType: z.string().min(1, 'Business type is required'),
    customerSource: z.string().min(1, 'Customer source is required'),
    biggestStruggle: z.string().min(1, 'Biggest struggle is required'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    perfectFeature: z.string().optional(),
  }),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>['body'];
