import { Router } from "express";
import multer from "multer";
import { ShopController } from "./shop.controller";
import { authenticate } from "../../middlewares/auth";
import { requireEntrepreneur, requireAdmin } from "../../middlewares/rbac";
import { validate } from "../../middlewares/validation";
import { createShopSchema, updateShopSchema } from "./shop.validation";
import { AppError } from "../../middlewares/errorHandler";

const router = Router();
const shopController = new ShopController();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (
    _req,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new AppError("Only image files are allowed", 400) as any);
    }
  },
});

const shopUpload = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

// Public routes
router.get("/", shopController.getShops);
router.get("/:slug", shopController.getShopBySlug);

// Protected routes
router.get("/me", authenticate, shopController.getMyShop);

// Protected routes
router.post(
  "/",
  authenticate,
  requireEntrepreneur,
  shopUpload,
  validate(createShopSchema),
  shopController.createShop
);

router.patch(
  "/:id",
  authenticate,
  shopUpload,
  validate(updateShopSchema),
  shopController.updateShop
);

router.delete("/:id", authenticate, shopController.deleteShop);

// Admin only routes
router.patch(
  "/:id/activate",
  authenticate,
  requireAdmin,
  shopController.activateShop
);
router.patch(
  "/:id/deactivate",
  authenticate,
  requireAdmin,
  shopController.deactivateShop
);

export default router;
