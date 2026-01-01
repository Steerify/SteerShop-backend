import { prisma } from '../../config/database';
import { AppError, ForbiddenError, NotFoundError } from '../../middlewares/errorHandler';
import { CreateReviewInput, UpdateReviewInput } from './review.validation';
import { calculatePagination, generatePaginationMeta } from '../../utils/pagination';

export class ReviewService {
  async createReview(userId: string, data: CreateReviewInput) {
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Check if user has purchased this product (optional - can be enabled)
    // const hasPurchased = await prisma.orderItem.findFirst({
    //   where: {
    //     productId: data.productId,
    //     order: {
    //       customerId: userId,
    //       payment: {
    //         status: 'SUCCESS',
    //       },
    //     },
    //   },
    // });

    // if (!hasPurchased) {
    //   throw new AppError('You can only review products you have purchased', 403);
    // }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_customerId: {
          productId: data.productId,
          customerId: userId,
        },
      },
    });

    if (existingReview) {
      throw new AppError('You have already reviewed this product', 409);
    }

    const review = await prisma.review.create({
      data: {
        ...data,
        customerId: userId,
      },
      include: {
        customer: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return review;
  }

  async getProductReviews(productId: string, page: number = 1, limit: number = 10) {
    const { skip, take } = calculatePagination(page, limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        skip,
        take,
        include: {
          customer: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where: { productId } }),
    ]);

    // Calculate average rating
    const allReviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const averageRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

    const meta = generatePaginationMeta(page, limit, total);

    return { reviews, meta, averageRating };
  }

  async updateReview(reviewId: string, userId: string, userRole: string, data: UpdateReviewInput) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.customerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to update this review');
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data,
      include: {
        customer: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return updatedReview;
  }

  async deleteReview(reviewId: string, userId: string, userRole: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.customerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to delete this review');
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    return { message: 'Review deleted successfully' };
  }
}
