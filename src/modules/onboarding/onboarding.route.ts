import { Router } from 'express';
import { OnboardingController } from './onboarding.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validation';
import { onboardingSchema } from './onboarding.validation';
import { Role } from '../../types';

const router = Router();
const onboardingController = new OnboardingController();

// POST /api/v1/onboarding
router.post(
  '/',
  authenticate,
  requireRole(Role.ENTREPRENEUR),
  validate(onboardingSchema),
  onboardingController.completeOnboarding
);

export default router;
