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

router.post('/', authenticate, (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, async (err: any) => {
    try {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File size too large. maximum limit is 5MB', 400));
        }
        return next(new AppError(`File upload error: ${err.message}`, 400));
      } else if (err) {
        return next(err);
      }

      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const url = await uploadService.uploadImage(req.file);
      return successResponse(res, { url }, 'File uploaded successfully');
    } catch (error) {
      return next(error);
    }
  });
});

export default router;
