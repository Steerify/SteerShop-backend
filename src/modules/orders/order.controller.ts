import { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { parsePaginationParams } from '../../utils/pagination';
import { OrderStatus } from '../../types';

const orderService = new OrderService();

export class OrderController {
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.createOrder(req.user!.id, req.body);
      return successResponse(res, order, 'Order created successfully', 201);
    } catch (error) {
      return next(error);
    }
  }

  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePaginationParams(req.query);
      const filters = {
        shopId: req.query.shopId as string,
        status: req.query.status as OrderStatus,
      };
      const { orders, meta } = await orderService.getOrders(
        req.user!.id,
        req.user!.role,
        page,
        limit,
        filters
      );
      return paginatedResponse(res, orders, meta, 'Orders retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getOrderById(req.params.id, req.user!.id, req.user!.role);
      return successResponse(res, order, 'Order retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.updateOrderStatus(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.body
      );
      return successResponse(res, order, 'Order status updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  async generateWhatsAppLink(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await orderService.generateWhatsAppLink(req.params.id, req.user!.id, req.user!.role);
      return successResponse(res, result, 'WhatsApp link generated successfully');
    } catch (error) {
      return next(error);
    }
  }
}
