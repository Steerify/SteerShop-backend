import { Request, Response, NextFunction } from 'express';
import { ProductService } from './product.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { parsePaginationParams } from '../../utils/pagination';

const productService = new ProductService();

export class ProductController {
  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.createProduct(req.user!.id, req.body);
      return successResponse(res, product, 'Product created successfully', 201);
    } catch (error) {
      return next(error);
    }
  }

  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePaginationParams(req.query);
      const filters = {
        shopId: req.query.shopId as string,
        categoryId: req.query.categoryId as string,
        minPrice: req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined,
        search: req.query.search as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      };
      const { products, meta } = await productService.getProducts(page, limit, filters);
      return paginatedResponse(res, products, meta, 'Products retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getProductById(req.params.id);
      return successResponse(res, product, 'Product retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.updateProduct(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.body
      );
      return successResponse(res, product, 'Product updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.deleteProduct(req.params.id, req.user!.id, req.user!.role);
      return successResponse(res, result, result.message);
    } catch (error) {
      return next(error);
    }
  }
}
