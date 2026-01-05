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

// IMPORTANT: Fix the route handler - remove the immediate function wrapper
router.post('/', authenticate, upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Upload request received:', {
      hasFile: !!req.file,
      fileInfo: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      } : null,
      body: req.body,
      headers: {
        'content-type': req.headers['content-type'],
        authorization: req.headers.authorization ? 'present' : 'missing',
      }
    });

    if (!req.file) {
      console.error('No file in request:', {
        bodyKeys: Object.keys(req.body),
        files: (req as any).files,
      });
      throw new AppError('No file uploaded. Please select an image file.', 400);
    }

    // Get folder from request body (if provided)
    const folder = req.body.folder || 'steersolo';
    console.log('Uploading to folder:', folder);

    // Pass folder to upload service (update your UploadService to accept folder)
    const url = await uploadService.uploadImage(req.file, folder);
    
    console.log('Upload successful:', url);
    
    return successResponse(res, { url }, 'File uploaded successfully');
  } catch (error) {
    console.error('Upload route error:', error);
    return next(error);
  }
});

// Add CORS headers if needed (especially for development)
router.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Add OPTIONS handler for preflight requests
router.options('/', (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.status(200).end();
});

export default router;