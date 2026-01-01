import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/rbac';
import { prisma } from '../../config/database';
import { successResponse } from '../../utils/response';

const router = Router();

// User routes
router.post('/', authenticate, async (req, res, next) => {
  try {
    const feedback = await prisma.feedback.create({
      data: {
        ...req.body,
        userId: req.user!.id,
      },
    });
    return successResponse(res, feedback, 'Feedback submitted successfully', 201);
  } catch (error) {
    return next(error);
  }
});

// Admin routes
router.get('/', authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const feedback = await prisma.feedback.findMany({
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, feedback, 'Feedback retrieved successfully');
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const feedback = await prisma.feedback.update({
      where: { id: req.params.id },
      data: { status: req.body.status, response: req.body.response },
    });
    return successResponse(res, feedback, 'Feedback status updated successfully');
  } catch (error) {
    return next(error);
  }
});

export default router;
