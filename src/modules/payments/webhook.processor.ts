import { prisma } from "../../config/database";
import { PaymentStatus, SubscriptionStatus } from "../../types";
import { AppError } from "../../middlewares/errorHandler";
import { incCounter, addRevenue } from "../../utils/metrics";
import { isValidPaystackSignature } from "./signature";

export async function processPaystackWebhook(payload: any, signature?: string) {
  // Defensive signature verification (timing-safe)
  if (signature) {
    if (!isValidPaystackSignature(payload, signature)) {
      incCounter("webhook_processed_failure");
      throw new AppError("Invalid signature", 401);
    }
  }

  incCounter("webhook_received");

  const event = payload.event;
  const data = payload.data;

  if (event !== "charge.success") {
    return { message: "Event not handled" };
  }

  const reference = data.reference;

  // Try order payment first
  const payment = await prisma.payment.findUnique({
    where: { reference },
    include: { order: true } as any,
  });

  if (payment) {
    if (payment.status === PaymentStatus.SUCCESS) {
      return { message: "Payment already processed" };
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          paystackResponse: data,
          paidAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "PROCESSING" },
      }),
      prisma.revenueTransaction.create({
        data: {
          shopId: (payment.order as any)?.shopId,
          orderId: payment.orderId,
          amount: data.amount || 0,
          currency: data.currency || "NGN",
          payment_reference: reference,
          payment_method: "paystack",
          transaction_type: "order_payment",
          metadata: data,
        },
      }),
    ]);

    incCounter("webhook_processed_success");
    addRevenue(data.amount || 0);

    return { message: "Order payment processed successfully" };
  }

  // Try subscription payment
  let subPayment = await prisma.subscriptionPayment.findUnique({
    where: { reference },
    include: { subscription: true } as any,
  });

  if (!subPayment) {
    // Try to create from metadata
    const metadata = data.metadata || {};
    const subscriptionIdFromMeta =
      metadata.subscriptionId || metadata.subscription_id;
    let subscription = null as any;

    if (subscriptionIdFromMeta) {
      subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionIdFromMeta },
      });
    } else if (metadata.shopId || metadata.shop_id) {
      const shopId = metadata.shopId || metadata.shop_id;
      subscription = await prisma.subscription.findUnique({
        where: { shopId },
      });
    }

    if (subscription) {
      subPayment = await prisma.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          reference,
          amount: data.amount || subscription.amount,
          paystackResponse: data,
          status: PaymentStatus.PENDING as any,
        },
        include: { subscription: true } as any,
      });
    }
  }

  if (!subPayment) {
    // Not an order or a recognizable subscription payment
    return { message: "Payment not found" };
  }

  if (subPayment.status === PaymentStatus.SUCCESS) {
    return { message: "Subscription payment already processed" };
  }

  const now = new Date();
  let nextPeriodEnd = new Date();

  // Defensive handling: cast subscription to a safe shape so TypeScript
  // does not infer 'never' and ensure invalid dates are ignored.
  const subscription = (subPayment.subscription ?? null) as {
    currentPeriodEnd?: string | null;
  } | null;

  if (subscription?.currentPeriodEnd) {
    const parsed = new Date(subscription.currentPeriodEnd);
    if (!isNaN(parsed.getTime()) && parsed > now) {
      nextPeriodEnd = parsed;
    }
  }

  nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

  await prisma.$transaction([
    prisma.subscriptionPayment.update({
      where: { id: subPayment.id },
      data: {
        status: PaymentStatus.SUCCESS,
        paystackResponse: data,
        paidAt: new Date(),
      },
    }),
    prisma.subscription.update({
      where: { id: subPayment.subscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE as any,
        currentPeriodStart: now,
        currentPeriodEnd: nextPeriodEnd,
      },
    }),
    prisma.revenueTransaction.create({
      data: {
        subscriptionId: subPayment.subscriptionId,
        amount: data.amount || subPayment.amount,
        currency: data.currency || "NGN",
        payment_reference: reference,
        payment_method: "paystack",
        transaction_type: "subscription",
        metadata: data,
      },
    }),
  ]);

  incCounter("webhook_processed_success");
  addRevenue(data.amount || subPayment.amount || 0);

  return { message: "Subscription payment processed successfully" };
}
