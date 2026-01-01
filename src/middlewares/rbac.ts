import { Request, Response, NextFunction } from 'express';
import { Role } from '../types';
import { ForbiddenError, UnauthorizedError } from './errorHandler';

export const requireRole = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError('You do not have permission to access this resource')
      );
    }

    next();
  };
};

export const requireAdmin = requireRole(Role.ADMIN);
export const requireEntrepreneur = requireRole(Role.ENTREPRENEUR, Role.ADMIN);
export const requireCustomer = requireRole(Role.CUSTOMER, Role.ENTREPRENEUR, Role.ADMIN);

export const requireOwnership = (_resourceIdParam: string = 'id') => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
      }

      // Admin can access everything
      if (req.user.role === Role.ADMIN) {
        return next();
      }

      // This is a generic ownership check
      // Specific ownership validation should be done in the service layer
      // For now, we'll just pass through and let services handle it
      next();
    } catch (error) {
      next(error);
    }
  };
};
