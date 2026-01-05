import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";
import { enqueueWebhook } from "../../queues/webhook.queue";
import { successResponse } from "../../utils/response";
import { NotFoundError } from "../../middlewares/errorHandler";

export class AdminWebhookController {
  async listDeadLetters(_req: Request, res: Response, next: NextFunction) {
    try {
      const items = await prisma.deadLetter.findMany({
        orderBy: { createdAt: "desc" } as any,
      });
      return successResponse(res, items, "Dead letters fetched");
    } catch (err) {
      return next(err);
    }
  }

  async reprocessDeadLetter(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const record = await prisma.deadLetter.findUnique({
        where: { id } as any,
      });
      if (!record) throw new NotFoundError("Dead letter not found");

      await enqueueWebhook(record.payload, record.signature || undefined);

      // If enqueue successful, delete dead letter
      await prisma.deadLetter.delete({ where: { id } as any });

      return successResponse(res, null, "Dead letter requeued successfully");
    } catch (err) {
      return next(err);
    }
  }

  async deleteDeadLetter(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const record = await prisma.deadLetter.findUnique({
        where: { id } as any,
      });
      if (!record) throw new NotFoundError("Dead letter not found");

      await prisma.deadLetter.delete({ where: { id } as any });
      return successResponse(res, null, "Dead letter deleted");
    } catch (err) {
      return next(err);
    }
  }
}
