import { Request, Response, NextFunction } from 'express';
import { ReviewService } from './review.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { parsePaginationParams } from '../../utils/pagination';

const reviewService = new ReviewService();

export class ReviewController {
  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await reviewService.createReview(req.user!.id, req.body);
      return successResponse(res, review, 'Review created successfully', 201);
    } catch (error) {
      return next(error);
    }
  }

  async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePaginationParams(req.query);
      const result = await reviewService.getProductReviews(req.params.productId, page, limit);
      return paginatedResponse(res, { reviews: result.reviews, averageRating: result.averageRating }, result.meta, 'Reviews retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async updateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await reviewService.updateReview(req.params.id, req.user!.id, req.user!.role, req.body);
      return successResponse(res, review, 'Review updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reviewService.deleteReview(req.params.id, req.user!.id, req.user!.role);
      return successResponse(res, result, result.message);
    } catch (error) {
      return next(error);
    }
  }
}
