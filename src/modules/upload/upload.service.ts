import { v2 as cloudinary } from 'cloudinary';
import { config } from '../../config/env';
import { AppError } from '../../middlewares/errorHandler';

export class UploadService {
  constructor() {
    if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
      cloudinary.config({
        cloud_name: config.cloudinary.cloudName,
        api_key: config.cloudinary.apiKey,
        api_secret: config.cloudinary.apiSecret,
      });
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
      // Fallback or development mock if credentials are missing
      console.warn('Cloudinary credentials missing. Returning local mock URL.');
      const fileName = file.originalname.split('.')[0];
      return `https://res.cloudinary.com/steersolo/image/upload/v1/mock/${fileName}_${Date.now()}`;
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'steersolo',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', {
              message: error.message,
              http_code: (error as any).http_code,
              stack: error.stack
            });
            return reject(new AppError(`Cloudinary upload failed: ${error.message}`, 500));
          }
          if (result) {
            resolve(result.secure_url);
          } else {
            console.error('Cloudinary upload result is undefined');
            reject(new AppError('Upload failed: Result undefined', 500));
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  }
}
