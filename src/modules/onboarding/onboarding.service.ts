import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { OnboardingInput } from './onboarding.validation';

export class OnboardingService {
  async completeOnboarding(userId: string, data: OnboardingInput) {
    // Check if user exists and is an entrepreneur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, onboardingCompleted: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role !== 'ENTREPRENEUR') {
      throw new AppError('Only entrepreneurs can complete onboarding', 403);
    }

    // Check if onboarding already completed
    if (user.onboardingCompleted) {
      throw new AppError('Onboarding already completed', 400);
    }

    // Create onboarding response and update user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create onboarding response
      await tx.onboardingResponse.create({
        data: {
          userId,
          businessType: data.businessType,
          customerSource: data.customerSource,
          biggestStruggle: data.biggestStruggle,
          paymentMethod: data.paymentMethod,
          perfectFeature: data.perfectFeature,
        },
      });

      // Update user's onboarding status
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true },
        select: {
          id: true,
          email: true,
          role: true,
          onboardingCompleted: true,
        },
      });

      return updatedUser;
    });

    return {
      user: result,
    };
  }
}
