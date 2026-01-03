import crypto from 'crypto';
import { PaymentStatus } from '../../types';
import { prisma } from '../../config/database';
import { paystackConfig, paystackHeaders } from '../../config/paystack';
import { AppError, NotFoundError } from '../../middlewares/errorHandler';
import { InitializePaymentInput } from './payment.validation';

export class PaymentService {
  async initializePayment(userId: string, data: InitializePaymentInput) {
    // Get order
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        payment: true,
        customer: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Verify user owns the order
    if (order.customerId !== userId) {
      throw new AppError('You do not have permission to pay for this order', 403);
    }

    // Check if payment already exists and is successful
    if (order.payment && order.payment.status === PaymentStatus.SUCCESS) {
      throw new AppError('This order has already been paid', 400);
    }

    // Generate unique reference
    const reference = `PAY-${order.orderNumber}-${Date.now()}`;

    // Initialize payment with Paystack
    const response = await fetch(`${paystackConfig.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: paystackHeaders,
      body: JSON.stringify({
        email: order.customer?.email || (order as any).customerEmail,
        amount: (order as any).total_amount, // Amount in kobo
        reference,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          deliveryAddress: `${order.deliveryAddress}, ${order.deliveryCity}, ${order.deliveryState}`,
        },
      }),
    });

    const result = await response.json() as any;

    if (!result.status) {
      throw new AppError('Failed to initialize payment', 500);
    }

    // Create or update payment record
    const payment = await prisma.payment.upsert({
      where: { orderId: (order as any).id },
      update: {
        reference,
        amount: (order as any).total_amount,
        paystackResponse: result.data,
      },
      create: {
        orderId: (order as any).id,
        reference,
        amount: (order as any).total_amount,
        paystackResponse: result.data,
      },
    });

    return {
      payment,
      authorizationUrl: result.data.authorization_url,
      accessCode: result.data.access_code,
      reference: result.data.reference,
    };
  }

  async verifyPayment(reference: string) {
    // Verify with Paystack
    const response = await fetch(`${paystackConfig.baseUrl}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: paystackHeaders,
    });

    const result = await response.json() as any;

    if (!result.status) {
      throw new AppError('Failed to verify payment', 500);
    }

    const paystackData = result.data;

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Check for idempotency
    if (payment.status === PaymentStatus.SUCCESS) {
      return payment;
    }

    // Update payment status
    const status = paystackData.status === 'success' 
      ? PaymentStatus.SUCCESS 
      : PaymentStatus.FAILED;

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        paystackResponse: paystackData,
        paidAt: status === PaymentStatus.SUCCESS ? new Date() : null,
      },
      include: { order: true },
    });

    return updatedPayment;
  }

  async handleWebhook(payload: any, signature: string) {
    // Verify signature
    const hash = crypto
      .createHmac('sha512', paystackConfig.secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (hash !== signature) {
      throw new AppError('Invalid signature', 401);
    }

    const event = payload.event;
    const data = payload.data;

    // Handle different events
    if (event === 'charge.success') {
      const reference = data.reference;

      // Find payment
      const payment = await prisma.payment.findUnique({
        where: { reference },
      });

      if (!payment) {
        console.log(`Payment not found for reference: ${reference}`);
        return { message: 'Payment not found' };
      }

      // Check idempotency
      if (payment.status === PaymentStatus.SUCCESS) {
        return { message: 'Payment already processed' };
      }

      // Update payment and order status
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
          data: {
            status: 'PROCESSING',
          },
        }),
      ]);

      return { message: 'Payment processed successfully' };
    }

    return { message: 'Event not handled' };
  }
}
