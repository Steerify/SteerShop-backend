import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { successResponse } from '../../utils/response';

const authService = new AuthService();

export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.signup(req.body);
      return successResponse(res, result, 'Account created successfully', 201);
    } catch (error) {
      return next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      return next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.refresh(req.body);
      return successResponse(res, result, 'Token refreshed successfully');
    } catch (error) {
      return next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.logout(refreshToken);
      return successResponse(res, result, 'Logged out successfully');
    } catch (error) {
      return next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body);
      return successResponse(res, result, result.message);
    } catch (error) {
      return next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.resetPassword(req.body);
      return successResponse(res, result, result.message);
    } catch (error) {
      return next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      const result = await authService.verifyEmail(token);
      return successResponse(res, result, 'Email verified successfully');
    } catch (error) {
      return next(error);
    }
  }

  async googleSignup(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.googleSignup(req.body);
      return successResponse(res, result, 'Account created successfully', 201);
    } catch (error) {
      return next(error);
    }
  }

  async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.googleLogin(req.body);
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      return next(error);
    }
  }
}
