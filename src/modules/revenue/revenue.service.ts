import { prisma } from "../../config/database";
import { AppError } from "../../middlewares/errorHandler";

export class RevenueService {
  async createTransaction(data: {
    shopId?: string;
    orderId?: string;
    subscriptionId?: string;
    amount: number;
    currency?: string;
    payment_reference?: string;
    payment_method?: string;
    transaction_type?: string;
    metadata?: any;
  }) {
    if (!data.amount || data.amount <= 0) {
      throw new AppError("Amount must be greater than zero", 400);
    }

    const t = await prisma.revenueTransaction.create({ data });
    return t;
  }

  async listTransactions(query: {
    page?: number;
    limit?: number;
    shopId?: string;
    transaction_type?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.shopId) where.shopId = query.shopId;
    if (query.transaction_type) where.transaction_type = query.transaction_type;
    if (query.startDate || query.endDate) {
      where.createdAt = {} as any;
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [items, total] = await Promise.all([
      prisma.revenueTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" } as any,
      }),
      prisma.revenueTransaction.count({ where }),
    ]);

    const { generatePaginationMeta } = await import("../../utils/pagination");
    const meta = generatePaginationMeta(page, limit, total);
    return { items, meta };
  }
}
