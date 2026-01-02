import { Request, Response, NextFunction } from 'express';
import { OnboardingService } from './onboarding.service';
import { successResponse } from '../../utils/response';

const onboardingService = new OnboardingService();

export class OnboardingController {
  async completeOnboarding(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const result = await onboardingService.completeOnboarding(
        req.user.id,
        req.body
      );

      return successResponse(
        res,
        result,
        'Onboarding completed successfully',
        200
      );
    } catch (error) {
      return next(error);
    }
  }
}
