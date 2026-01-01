import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { successResponse } from '../../utils/response';

const paymentService = new PaymentService();

export class PaymentController {
  async initializePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.initializePayment(req.user!.id, req.body);
      return successResponse(res, result, 'Payment initialized successfully');
    } catch (error) {
      return next(error);
    }
  }

  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.verifyPayment(req.params.reference);
      return successResponse(res, payment, 'Payment verified successfully');
    } catch (error) {
      return next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      const result = await paymentService.handleWebhook(req.body, signature);
      return successResponse(res, result, result.message);
    } catch (error) {
      return next(error);
    }
  }
}
