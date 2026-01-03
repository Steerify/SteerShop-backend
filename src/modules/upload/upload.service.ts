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
      return `https://res.cloudinary.com/steersolo/image/upload/v1/mock/${file.filename || 'placeholder'}`;
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'steersolo',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(new AppError('Failed to upload image to Cloudinary', 500));
          }
          if (result) {
            resolve(result.secure_url);
          } else {
            reject(new AppError('Upload result is undefined', 500));
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  }
}
