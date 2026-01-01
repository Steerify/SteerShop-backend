import { OrderStatus } from '../../types';
import { prisma } from '../../config/database';
import { AppError, ForbiddenError, NotFoundError } from '../../middlewares/errorHandler';
import { CreateOrderInput, UpdateOrderStatusInput } from './order.validation';
import { calculatePagination, generatePaginationMeta } from '../../utils/pagination';
import { generateWhatsAppLink, formatOrderForWhatsApp } from '../../utils/whatsapp';

export class OrderService {
  async createOrder(userId: string, data: CreateOrderInput) {
    // Verify shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: data.shopId },
    });

    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    // Get products and verify availability
    const productIds = data.items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        shopId: data.shopId,
        isActive: true,
      },
    });

    if (products.length !== data.items.length) {
      throw new AppError('Some products are not available', 400);
    }

    // Check inventory
    for (const item of data.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new AppError(`Product not found`, 400);
      }
      if (product.inventory < item.quantity) {
        throw new AppError(`Insufficient inventory for ${product.name}`, 400);
      }
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = data.items.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
      };
    });

    const total = subtotal + data.deliveryFee;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order and update inventory in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: userId,
          shopId: data.shopId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          deliveryAddress: data.deliveryAddress,
          deliveryCity: data.deliveryCity,
          deliveryState: data.deliveryState,
          deliveryFee: data.deliveryFee,
          notes: data.notes,
          subtotal,
          total,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          shop: true,
        },
      });

      // Update inventory
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            inventory: {
              decrement: item.quantity,
            },
          },
        });
      }

      return newOrder;
    });

    return order;
  }

  async getOrders(
    userId: string,
    userRole: string,
    page: number = 1,
    limit: number = 10,
    filters?: {
      shopId?: string;
      status?: OrderStatus;
    }
  ) {
    const { skip, take } = calculatePagination(page, limit);

    const where: any = {};

    // Role-based filtering
    if (userRole === 'CUSTOMER') {
      where.customerId = userId;
    } else if (userRole === 'ENTREPRENEUR') {
      // Get entrepreneur's shop
      const shop = await prisma.shop.findUnique({
        where: { ownerId: userId },
      });
      if (shop) {
        where.shopId = shop.id;
      }
    }
    // ADMIN can see all orders

    if (filters?.shopId) where.shopId = filters.shopId;
    if (filters?.status) where.status = filters.status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
          shop: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          customer: {
            select: {
              id: true,
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
      }),
      prisma.order.count({ where }),
    ]);

    const meta = generatePaginationMeta(page, limit, total);

    return { orders, meta };
  }

  async getOrderById(orderId: string, userId: string, userRole: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shop: true,
        customer: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check access
    if (userRole === 'CUSTOMER' && order.customerId !== userId) {
      throw new ForbiddenError('You do not have access to this order');
    }

    if (userRole === 'ENTREPRENEUR' && order.shop.ownerId !== userId) {
      throw new ForbiddenError('You do not have access to this order');
    }

    return order;
  }

  async updateOrderStatus(orderId: string, userId: string, userRole: string, data: UpdateOrderStatusInput) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: true },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Only shop owner or admin can update status
    if (order.shop.ownerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to update this order');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: data.status as any },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shop: true,
      },
    });

    return updatedOrder;
  }

  async generateWhatsAppLink(orderId: string, userId: string, userRole: string) {
    const order = await this.getOrderById(orderId, userId, userRole);

    if (!order.shop.whatsapp) {
      throw new AppError('Shop does not have WhatsApp configured', 400);
    }

    const message = formatOrderForWhatsApp({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      items: order.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: order.total,
      deliveryAddress: `${order.deliveryAddress}, ${order.deliveryCity}, ${order.deliveryState}`,
    });

    const whatsappLink = generateWhatsAppLink({
      phone: order.shop.whatsapp,
      message,
    });

    return { whatsappLink, message };
  }
}
