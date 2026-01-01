import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/rbac';
import { prisma } from '../../config/database';
import { successResponse } from '../../utils/response';

const router = Router();

// Public routes
router.get('/', async (_req, res, next) => {
  try {
    const rewards = await prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { points: 'asc' },
    });
    return successResponse(res, rewards, 'Rewards retrieved successfully');
  } catch (error) {
    return next(error);
  }
});

// Admin routes
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const reward = await prisma.reward.create({ data: req.body });
    return successResponse(res, reward, 'Reward created successfully', 201);
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const reward = await prisma.reward.update({ where: { id: req.params.id }, data: req.body });
    return successResponse(res, reward, 'Reward updated successfully');
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await prisma.reward.delete({ where: { id: req.params.id } });
    return successResponse(res, {}, 'Reward deleted successfully');
  } catch (error) {
    return next(error);
  }
});

export default router;
