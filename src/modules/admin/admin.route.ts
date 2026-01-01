import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/rbac';

const router = Router();
const adminController = new AdminController();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

router.get('/analytics', adminController.getAnalytics);
router.get('/users', adminController.getAllUsers);
router.get('/shops', adminController.getAllShops);
router.get('/orders', adminController.getAllOrders);
router.get('/products', adminController.getAllProducts);
router.patch('/users/:id/role', adminController.changeUserRole);

export default router;
