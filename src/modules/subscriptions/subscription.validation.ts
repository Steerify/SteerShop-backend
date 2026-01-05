import { z } from "zod";

export const initializeSubscriptionSchema = z.object({
  // No body needed for now — subscription is for the authenticated user's shop
});

export type InitializeSubscriptionInput = z.infer<
  typeof initializeSubscriptionSchema
>;
