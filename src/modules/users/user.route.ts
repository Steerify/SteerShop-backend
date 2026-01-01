import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validation';
import { updateProfileSchema } from './user.validation';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authenticate);

router.get('/me', userController.getCurrentUser);
router.put('/me', validate(updateProfileSchema), userController.updateProfile);

// Admin only routes
router.get('/', requireAdmin, userController.listUsers);
router.get('/:id', requireAdmin, userController.getUserById);

export default router;
