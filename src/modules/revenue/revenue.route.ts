import { Router } from "express";
import { authenticate } from "../../middlewares/auth";
import { requireAdmin } from "../../middlewares/rbac";
import { RevenueController } from "./revenue.controller";

const router = Router();
const controller = new RevenueController();

// Create a revenue record (authenticated)
router.post("/transactions", authenticate, controller.createTransaction);

// List transactions (admin only)
router.get(
  "/transactions",
  authenticate,
  requireAdmin,
  controller.listTransactions
);

export default router;
