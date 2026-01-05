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

  async uploadImage(file: Express.Multer.File, folder: string = 'steersolo'): Promise<string> {
    console.log('Uploading to Cloudinary:', {
      cloudName: config.cloudinary.cloudName,
      hasCredentials: !!(config.cloudinary.apiKey && config.cloudinary.apiSecret),
      fileName: file.originalname,
      fileSize: file.size,
      folder,
    });

    if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
      // Fallback or development mock if credentials are missing
      console.warn('Cloudinary credentials missing. Returning mock URL.');
      const fileName = file.originalname.split('.')[0];
      return `https://res.cloudinary.com/steersolo/image/upload/v1/${folder}/${fileName}_${Date.now()}`;
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder, // Use the folder parameter
          resource_type: 'auto',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
          timeout: 60000, // 60 second timeout
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error details:', {
              message: error.message,
              http_code: (error as any).http_code,
              name: error.name,
              folder,
            });
            return reject(new AppError(`Upload failed: ${error.message}`, 500));
          }
          
          if (result && result.secure_url) {
            console.log('Cloudinary upload successful:', {
              url: result.secure_url,
              publicId: result.public_id,
              folder,
              format: result.format,
              size: result.bytes,
            });
            resolve(result.secure_url);
          } else {
            console.error('Cloudinary upload result is undefined or missing URL:', result);
            reject(new AppError('Upload failed: No URL returned', 500));
          }
        }
      );

      // Add error handler for the stream
      uploadStream.on('error', (error) => {
        console.error('Upload stream error:', error);
        reject(new AppError(`Stream error: ${error.message}`, 500));
      });

      // Write the file buffer to the stream
      uploadStream.end(file.buffer);
    });
  }
}