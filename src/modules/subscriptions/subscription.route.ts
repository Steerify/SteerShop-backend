import { Router } from "express";
import { authenticate } from "../../middlewares/auth";
import { requireEntrepreneur } from "../../middlewares/rbac";
import { validate } from "../../middlewares/validation";
import { SubscriptionController } from "./subscription.controller";
import { initializeSubscriptionSchema } from "./subscription.validation";

const router = Router();
const subscriptionController = new SubscriptionController();

// Initialize subscription payment (authenticated entrepreneur)
router.post(
  "/initialize",
  authenticate,
  requireEntrepreneur,
  validate(initializeSubscriptionSchema),
  subscriptionController.initialize
);

// Get current subscription for authenticated shop owner
router.get("/me", authenticate, subscriptionController.getMySubscription);

export default router;
