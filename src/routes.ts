import { Router } from 'express';
import authRoutes from './modules/auth/auth.route';
import userRoutes from './modules/users/user.route';
import shopRoutes from './modules/shops/shop.route';
import productRoutes from './modules/products/product.route';
import orderRoutes from './modules/orders/order.route';
import paymentRoutes from './modules/payments/payment.route';
import reviewRoutes from './modules/reviews/review.route';
import adminRoutes from './modules/admin/admin.route';
import offerRoutes from './modules/offers/offer.route';
import courseRoutes from './modules/courses/course.route';
import rewardRoutes from './modules/rewards/reward.route';
import feedbackRoutes from './modules/feedback/feedback.route';

const router = Router();

// API v1 routes
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to SteerSolo API v1',
    docs: '/api/v1/docs',
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/shops', shopRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/offers', offerRoutes);
router.use('/courses', courseRoutes);
router.use('/rewards', rewardRoutes);
router.use('/feedback', feedbackRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'SteerSolo API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
