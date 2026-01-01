import { Router } from 'express';
import { ReviewController } from './review.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { createReviewSchema, updateReviewSchema } from './review.validation';

const router = Router();
const reviewController = new ReviewController();

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);

// Protected routes
router.post('/', authenticate, validate(createReviewSchema), reviewController.createReview);
router.put('/:id', authenticate, validate(updateReviewSchema), reviewController.updateReview);
router.delete('/:id', authenticate, reviewController.deleteReview);

export default router;
