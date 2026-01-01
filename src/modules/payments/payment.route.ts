import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authenticate } from '../../middlewares/auth';
import { paymentLimiter } from '../../middlewares/rateLimiter';
import { validate } from '../../middlewares/validation';
import { initializePaymentSchema, verifyPaymentSchema } from './payment.validation';

const router = Router();
const paymentController = new PaymentController();

// Apply rate limiting to payment routes
router.use(paymentLimiter);

router.post('/initialize', authenticate, validate(initializePaymentSchema), paymentController.initializePayment);
router.get('/verify/:reference', authenticate, validate(verifyPaymentSchema), paymentController.verifyPayment);
router.post('/webhook', paymentController.handleWebhook); // No auth for webhooks

export default router;
