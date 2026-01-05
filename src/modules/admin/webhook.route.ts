import { Router } from "express";
import { AdminWebhookController } from "./webhook.controller";

const router = Router();
const controller = new AdminWebhookController();

router.get("/webhooks/deadletters", controller.listDeadLetters);
router.post(
  "/webhooks/deadletters/:id/reprocess",
  controller.reprocessDeadLetter
);
router.delete("/webhooks/deadletters/:id", controller.deleteDeadLetter);

export default router;
