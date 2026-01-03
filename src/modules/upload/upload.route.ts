import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { UploadService } from './upload.service';
import { authenticate } from '../../middlewares/auth';
import { successResponse } from '../../utils/response';
import { AppError } from '../../middlewares/errorHandler';

const router = Router();
const uploadService = new UploadService();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed', 400));
    }
  },
});

router.post('/', authenticate, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const url = await uploadService.uploadImage(req.file);
    return successResponse(res, { url }, 'File uploaded successfully');
  } catch (error) {
    return next(error);
  }
});

export default router;
