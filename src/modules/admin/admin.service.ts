import { prisma } from '../../config/database';
import { calculatePagination, generatePaginationMeta } from '../../utils/pagination';

export class AdminService {
  async getAnalytics() {
    const [
      totalUsers,
      totalShops,
      activeShops,
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.shop.count(),
      prisma.shop.count({ where: { isActive: true } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
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
          shop: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      totalUsers,
      totalShops,
      activeShops,
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue: totalRevenue._sum.amount || 0,
      recentOrders,
    };
  }

  async getAllUsers(page: number = 1, limit: number = 10) {
    const { skip, take } = calculatePagination(page, limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          profile: true,
          shop: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    const meta = generatePaginationMeta(page, limit, total);

    return { users, meta };
  }

  async getAllShops(page: number = 1, limit: number = 10) {
    const { skip, take } = calculatePagination(page, limit);

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        skip,
        take,
        include: {
          owner: {
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
          subscription: true,
          _count: {
            select: {
              products: true,
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shop.count(),
    ]);

    const meta = generatePaginationMeta(page, limit, total);

    return { shops, meta };
  }

  async getAllOrders(page: number = 1, limit: number = 10) {
    const { skip, take } = calculatePagination(page, limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take,
        include: {
          customer: {
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
          shop: {
            select: {
              name: true,
              slug: true,
            },
          },
          payment: true,
          _count: {
            select: {
              items: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count(),
    ]);

    const meta = generatePaginationMeta(page, limit, total);

    return { orders, meta };
  }

  async getAllProducts(page: number = 1, limit: number = 10) {
    const { skip, take } = calculatePagination(page, limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take,
        include: {
          shop: {
            select: {
              name: true,
              slug: true,
            },
          },
          category: true,
          _count: {
            select: {
              reviews: true,
              orderItems: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count(),
    ]);

    const meta = generatePaginationMeta(page, limit, total);

    return { products, meta };
  }

  async changeUserRole(userId: string, role: 'ADMIN' | 'ENTREPRENEUR' | 'CUSTOMER') {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        profile: true,
      },
    });

    return user;
  }
}
