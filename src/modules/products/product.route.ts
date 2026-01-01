import { Router } from 'express';
import { ProductController } from './product.controller';
import { authenticate } from '../../middlewares/auth';
import { requireEntrepreneur } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validation';
import { createProductSchema, updateProductSchema } from './product.validation';

const router = Router();
const productController = new ProductController();

// Public routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Protected routes
router.post('/', authenticate, requireEntrepreneur, validate(createProductSchema), productController.createProduct);
router.put('/:id', authenticate, validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', authenticate, productController.deleteProduct);

export default router;
