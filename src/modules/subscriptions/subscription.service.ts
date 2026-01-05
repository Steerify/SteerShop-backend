import axios from "axios";
import { prisma } from "../../config/database";
import { paystackConfig, paystackHeaders } from "../../config/paystack";
import { AppError, NotFoundError } from "../../middlewares/errorHandler";
import { PaymentStatus, SubscriptionStatus } from "../../types";

export class SubscriptionService {
  async initializeSubscription(userId: string) {
    // Find shop owned by user
    const shop = await prisma.shop.findUnique({
      where: { ownerId: userId },
      include: {
        owner: { select: { id: true, email: true } },
        subscription: true,
      },
    });

    if (!shop) {
      throw new NotFoundError("Shop not found");
    }

    // Ensure subscription record exists
    let subscription = shop.subscription;

    if (!subscription) {
      const now = new Date();
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

      subscription = await prisma.subscription.create({
        data: {
          shopId: shop.id,
          status: SubscriptionStatus.TRIAL as any,
          trialEndsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          currentPeriodEnd,
        },
      });
    }

    // Create a unique reference
    const reference = `SUB-${shop.slug}-${Date.now()}`;

    // Initialize payment with Paystack
    const response = await axios.post(
      `${paystackConfig.baseUrl}/transaction/initialize`,
      {
        email: shop.owner?.email || undefined,
        amount: subscription.amount, // amount in kobo
        reference,
        metadata: {
          subscriptionId: subscription.id,
          shopId: shop.id,
        },
      },
      { headers: paystackHeaders }
    );

    const result = response.data as any;

    if (!result.status) {
      throw new AppError("Failed to initialize payment", 500);
    }

    // Persist subscription payment
    const subPayment = await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        reference: result.data.reference || reference,
        amount: subscription.amount,
        paystackResponse: result.data,
        status: PaymentStatus.PENDING as any,
      },
    });

    return {
      subscription,
      subscriptionPayment: subPayment,
      authorizationUrl: result.data.authorization_url,
      accessCode: result.data.access_code,
      reference: result.data.reference,
    };
  }

  async getMySubscription(userId: string) {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: userId },
      include: { subscription: true },
    });
    if (!shop || !shop.subscription) {
      throw new NotFoundError("Subscription not found");
    }

    return shop.subscription;
  }
}
