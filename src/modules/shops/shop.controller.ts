import { Request, Response, NextFunction } from 'express';
import { ShopService } from './shop.service';
import { UploadService } from '../upload/upload.service';
import { successResponse, paginatedResponse } from '../../utils/response';
import { parsePaginationParams } from '../../utils/pagination';

const shopService = new ShopService();
const uploadService = new UploadService();

export class ShopController {
  private async handleImageUploads(req: Request) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    if (!files) return;

    if (files.logo && files.logo[0]) {
      const logoUrl = await uploadService.uploadImage(files.logo[0]);
      req.body.logo_url = logoUrl;
    }

    if (files.banner && files.banner[0]) {
      const bannerUrl = await uploadService.uploadImage(files.banner[0]);
      req.body.banner_url = bannerUrl;
    }
  }

  async createShop(req: Request, res: Response, next: NextFunction) {
    try {
      await this.handleImageUploads(req);
      const shop = await shopService.createShop(req.user!.id, req.body);
      return successResponse(res, shop, 'Shop created successfully', 201);
    } catch (error) {
      return next(error);
    }
  }

  async getShops(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePaginationParams(req.query);
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const { shops, meta } = await shopService.getShops(page, limit, isActive);
      return paginatedResponse(res, shops, meta, 'Shops retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async getShopBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await shopService.getShopBySlug(req.params.slug);
      return successResponse(res, shop, 'Shop retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async updateShop(req: Request, res: Response, next: NextFunction) {
    try {
      await this.handleImageUploads(req);
      const shop = await shopService.updateShop(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.body
      );
      return successResponse(res, shop, 'Shop updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  async deleteShop(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await shopService.deleteShop(req.params.id, req.user!.id, req.user!.role);
      return successResponse(res, result, result.message);
    } catch (error) {
      return next(error);
    }
  }

  async activateShop(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await shopService.activateShop(req.params.id);
      return successResponse(res, shop, 'Shop activated successfully');
    } catch (error) {
      return next(error);
    }
  }

  async deactivateShop(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await shopService.deactivateShop(req.params.id);
      return successResponse(res, shop, 'Shop deactivated successfully');
    } catch (error) {
      return next(error);
    }
  }
}
