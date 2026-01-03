import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/rbac';
import { prisma } from '../../config/database';
import { successResponse } from '../../utils/response';

const router = Router();

// Public routes
router.get('/', async (_req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, courses, 'Courses retrieved successfully');
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.id } });
    return successResponse(res, course, 'Course retrieved successfully');
  } catch (error) {
    return next(error);
  }
});

// Admin routes
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { image_url, ...courseData } = req.body;
    const course = await prisma.course.create({ 
      data: {
        ...courseData,
        image_url
      } 
    });
    return successResponse(res, course, 'Course created successfully', 201);
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { image_url, ...courseData } = req.body;
    const course = await prisma.course.update({ 
      where: { id: req.params.id }, 
      data: {
        ...courseData,
        image_url
      } 
    });
    return successResponse(res, course, 'Course updated successfully');
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    return successResponse(res, {}, 'Course deleted successfully');
  } catch (error) {
    return next(error);
  }
});

export default router;
