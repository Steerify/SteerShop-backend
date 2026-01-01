import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { parsePaginationParams } from '../../utils/pagination';

const userService = new UserService();

export class UserController {
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getCurrentUser(req.user!.id);
      return successResponse(res, user, 'User retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await userService.updateProfile(req.user!.id, req.body);
      return successResponse(res, profile, 'Profile updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(req.params.id);
      return successResponse(res, user, 'User retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePaginationParams(req.query);
      const { users, meta } = await userService.listUsers(page, limit);
      return paginatedResponse(res, users, meta, 'Users retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }
}
