import { prisma } from '../../config/database';
import { AppError, ForbiddenError, NotFoundError } from '../../middlewares/errorHandler';
import { CreateProductInput, UpdateProductInput } from './product.validation';
import { calculatePagination, generatePaginationMeta } from '../../utils/pagination';

export class ProductService {
  async createProduct(userId: string, data: CreateProductInput) {
    // Verify shop ownership
    const shop = await prisma.shop.findUnique({
      where: { id: data.shopId },
    });

    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    if (shop.ownerId !== userId) {
      throw new ForbiddenError('You do not own this shop');
    }

    // Check slug uniqueness within shop
    const existingProduct = await prisma.product.findFirst({
      where: {
        shopId: data.shopId,
        slug: data.slug,
      },
    });

    if (existingProduct) {
      throw new AppError('Product slug already exists in this shop', 409);
    }

    const { images } = data;

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        compare_price: data.compare_price,
        stock_quantity: data.stock_quantity,
        type: data.type as any,
        shopId: data.shopId,
        categoryId: data.categoryId,
        images: images ? {
          create: images as any,
        } : undefined,
      } as any,
      include: {
        images: true,
        category: true,
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return product;
  }

  async getProducts(
    page: number = 1,
    limit: number = 10,
    filters?: {
      shopId?: string;
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      search?: string;
      isActive?: boolean;
    }
  ) {
    const { skip, take } = calculatePagination(page, limit);

    const where: any = {};

    if (filters?.shopId) where.shopId = filters.shopId;
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    
    if (filters?.minPrice || filters?.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          images: true,
          category: true,
          shop: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    const meta = generatePaginationMeta(page, limit, total);

    return { products, meta };
  }

  async getProductById(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        category: true,
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            whatsapp: true,
          },
        },
        reviews: {
          include: {
            customer: {
              select: {
                id: true,
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
          take: 10,
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Calculate average rating
    const reviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return { ...product, averageRating };
  }

  async updateProduct(productId: string, userId: string, userRole: string, data: UpdateProductInput) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if ((product.shop as any)?.ownerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to update this product');
    }

    const { images, ...productData } = data;

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(productData as any),
        images: images ? {
          deleteMany: {},
          create: images as any,
        } : undefined,
      },
      include: {
        images: true,
        category: true,
      },
    });

    return updatedProduct;
  }

  async deleteProduct(productId: string, userId: string, userRole: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { shop: true },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.shop?.ownerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to delete this product');
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return { message: 'Product deleted successfully' };
  }
}
