import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { parsePaginationParams } from '../../utils/pagination';

const adminService = new AdminService();

export class AdminController {
  async getAnalytics(_req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await adminService.getAnalytics();
      return successResponse(res, analytics, 'Analytics retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePaginationParams(req.query);
      const { users, meta } = await adminService.getAllUsers(page, limit);
      return paginatedResponse(res, users, meta, 'Users retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async getAllShops(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePaginationParams(req.query);
      const { shops, meta } = await adminService.getAllShops(page, limit);
      return paginatedResponse(res, shops, meta, 'Shops retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async getAllOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePaginationParams(req.query);
      const { orders, meta } = await adminService.getAllOrders(page, limit);
      return paginatedResponse(res, orders, meta, 'Orders retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async getAllProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePaginationParams(req.query);
      const { products, meta } = await adminService.getAllProducts(page, limit);
      return paginatedResponse(res, products, meta, 'Products retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async changeUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.body;
      const user = await adminService.changeUserRole(req.params.id, role);
      return successResponse(res, user, 'User role updated successfully');
    } catch (error) {
      return next(error);
    }
  }
}
