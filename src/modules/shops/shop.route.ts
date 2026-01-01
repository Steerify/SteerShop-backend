import { Router } from 'express';
import { ShopController } from './shop.controller';
import { authenticate } from '../../middlewares/auth';
import { requireEntrepreneur, requireAdmin } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validation';
import { createShopSchema, updateShopSchema } from './shop.validation';

const router = Router();
const shopController = new ShopController();

// Public routes
router.get('/', shopController.getShops);
router.get('/:slug', shopController.getShopBySlug);

// Protected routes
router.post('/', authenticate, requireEntrepreneur, validate(createShopSchema), shopController.createShop);
router.put('/:id', authenticate, validate(updateShopSchema), shopController.updateShop);
router.delete('/:id', authenticate, shopController.deleteShop);

// Admin only routes
router.patch('/:id/activate', authenticate, requireAdmin, shopController.activateShop);
router.patch('/:id/deactivate', authenticate, requireAdmin, shopController.deactivateShop);

export default router;
