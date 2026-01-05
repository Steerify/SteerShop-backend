import { Request, Response, NextFunction } from "express";
import { SubscriptionService } from "./subscription.service";
import { successResponse } from "../../utils/response";

const subscriptionService = new SubscriptionService();

export class SubscriptionController {
  async initialize(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await subscriptionService.initializeSubscription(
        req.user!.id
      );
      return successResponse(res, result, "Subscription payment initialized");
    } catch (error) {
      return next(error);
    }
  }

  async getMySubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await subscriptionService.getMySubscription(
        req.user!.id
      );
      return successResponse(
        res,
        subscription,
        "Subscription retrieved successfully"
      );
    } catch (error) {
      return next(error);
    }
  }
}
