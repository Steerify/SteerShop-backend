import { SubscriptionStatus } from "../../types";
import { prisma } from "../../config/database";
import {
  AppError,
  ForbiddenError,
  NotFoundError,
} from "../../middlewares/errorHandler";
import { CreateShopInput, UpdateShopInput } from "./shop.validation";
import {
  calculatePagination,
  generatePaginationMeta,
} from "../../utils/pagination";

export class ShopService {
  async createShop(userId: string, data: CreateShopInput) {
    // Check if user already has a shop
    const existingShop = await prisma.shop.findUnique({
      where: { ownerId: userId },
    });

    if (existingShop) {
      throw new AppError("You already have a shop", 409);
    }

    // Check if slug is taken
    const slugExists = await prisma.shop.findUnique({
      where: { slug: data.slug },
    });

    if (slugExists) {
      throw new AppError("This shop slug is already taken", 409);
    }

    // Create shop with 7-day trial subscription
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    const shop = await prisma.shop.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        logo_url: data.logo_url,
        banner_url: data.banner_url,
        phone: data.phone,
        whatsapp: data.whatsapp,
        address: data.address,
        city: data.city,
        state: data.state,
        payment_method: data.payment_method,
        bank_account_name: data.bank_account_name,
        bank_name: data.bank_name,
        bank_account_number: data.bank_account_number,
        paystack_public_key: data.paystack_public_key,
        ownerId: userId,
        subscription: {
          create: {
            status: SubscriptionStatus.TRIAL as any,
            trialEndsAt,
            currentPeriodEnd,
          },
        },
      } as any,
      include: {
        subscription: true,
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return shop;
  }

  async getShops(page: number = 1, limit: number = 10, isActive?: boolean) {
    const { skip, take } = calculatePagination(page, limit);

    const where = isActive !== undefined ? { isActive } : {};

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        skip,
        take,
        include: {
          owner: {
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
          subscription: true,
          _count: {
            select: {
              products: true,
              orders: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.shop.count({ where }),
    ]);

    const meta = generatePaginationMeta(page, limit, total);

    return { shops, meta };
  }

  async getShopBySlug(slug: string) {
    const shop = await prisma.shop.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        subscription: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!shop) {
      throw new NotFoundError("Shop not found");
    }

    return shop;
  }

  async getShopByOwner(ownerId: string) {
    const shop = await prisma.shop.findUnique({
      where: { ownerId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
        subscription: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!shop) {
      throw new NotFoundError("Shop not found");
    }

    return shop;
  }

  async updateShop(
    shopId: string,
    userId: string,
    userRole: string,
    data: UpdateShopInput
  ) {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      throw new NotFoundError("Shop not found");
    }

    // Check ownership (admin can update any shop)
    if (shop.ownerId !== userId && userRole !== "ADMIN") {
      throw new ForbiddenError(
        "You do not have permission to update this shop"
      );
    }

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        ...(data as any),
      },
      include: {
        subscription: true,
      },
    });

    return updatedShop;
  }

  async deleteShop(shopId: string, userId: string, userRole: string) {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      throw new NotFoundError("Shop not found");
    }

    // Check ownership (admin can delete any shop)
    if (shop.ownerId !== userId && userRole !== "ADMIN") {
      throw new ForbiddenError(
        "You do not have permission to delete this shop"
      );
    }

    await prisma.shop.delete({
      where: { id: shopId },
    });

    return { message: "Shop deleted successfully" };
  }

  async activateShop(shopId: string) {
    const shop = await prisma.shop.update({
      where: { id: shopId },
      data: { isActive: true },
    });

    return shop;
  }

  async deactivateShop(shopId: string) {
    const shop = await prisma.shop.update({
      where: { id: shopId },
      data: { isActive: false },
    });

    return shop;
  }

  async checkSubscriptionStatus(shopId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { shopId },
    });

    if (!subscription) {
      return { isValid: false, message: "No subscription found" };
    }

    const now = new Date();

    // Check if trial has ended
    if (
      subscription.status === SubscriptionStatus.TRIAL &&
      subscription.trialEndsAt
    ) {
      if (now > subscription.trialEndsAt) {
        // Trial ended, need payment
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: SubscriptionStatus.EXPIRED as any },
        });
        return { isValid: false, message: "Trial period has ended" };
      }
    }

    // Check if subscription has expired
    if (now > subscription.currentPeriodEnd) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.EXPIRED as any },
      });
      return { isValid: false, message: "Subscription has expired" };
    }

    return { isValid: true, subscription };
  }
}
