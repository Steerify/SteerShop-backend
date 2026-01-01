import { Router } from 'express';
import { OrderController } from './order.controller';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { createOrderSchema, updateOrderStatusSchema } from './order.validation';

const router = Router();
const orderController = new OrderController();

// All routes require authentication
router.use(authenticate);

router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/status', validate(updateOrderStatusSchema), orderController.updateOrderStatus);
router.get('/:id/whatsapp-link', orderController.generateWhatsAppLink);

export default router;
