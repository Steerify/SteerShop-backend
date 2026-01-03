import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/rbac';
import { prisma } from '../../config/database';
import { successResponse } from '../../utils/response';

const router = Router();

// Public routes
router.get('/', async (_req, res, next) => {
  try {
    const now = new Date();
    const offers = await prisma.offer.findMany({
      where: { 
        isActive: true, 
        startDate: { lte: now }, 
        valid_until: { gte: now } 
      } as any,
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, offers, 'Offers retrieved successfully');
  } catch (error) {
    return next(error);
  }
});

// Admin routes
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { startDate, valid_until, ...rest } = req.body;
    const offer = await prisma.offer.create({ 
      data: {
        ...rest,
        startDate: startDate ? new Date(startDate) : new Date(),
        valid_until: valid_until ? new Date(valid_until) : new Date(),
      } 
    });
    return successResponse(res, offer, 'Offer created successfully', 201);
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { startDate, valid_until, ...rest } = req.body;
    const data: any = { ...rest };
    if (startDate) data.startDate = new Date(startDate);
    if (valid_until) data.valid_until = new Date(valid_until);

    const offer = await prisma.offer.update({ 
      where: { id: req.params.id }, 
      data 
    });
    return successResponse(res, offer, 'Offer updated successfully');
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await prisma.offer.delete({ where: { id: req.params.id } });
    return successResponse(res, {}, 'Offer deleted successfully');
  } catch (error) {
    return next(error);
  }
});

export default router;
