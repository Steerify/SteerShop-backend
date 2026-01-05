import { Request, Response, NextFunction } from "express";
import { RevenueService } from "./revenue.service";
import { successResponse, paginatedResponse } from "../../utils/response";

const revenueService = new RevenueService();

export class RevenueController {
  async createTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body;
      const tr = await revenueService.createTransaction(payload);
      return successResponse(res, tr, "Transaction created", 201);
    } catch (err) {
      return next(err);
    }
  }

  async listTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const q = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        shopId: req.query.shopId as string | undefined,
        transaction_type: req.query.transaction_type as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };
      const result = await revenueService.listTransactions(q);
      return paginatedResponse(
        res,
        result.items,
        result.meta,
        "Transactions retrieved"
      );
    } catch (err) {
      return next(err);
    }
  }
}
