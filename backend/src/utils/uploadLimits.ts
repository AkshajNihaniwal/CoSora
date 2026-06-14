import multer from 'multer';
import { config } from '../config';

export const uploadLimits = {
  fileSize: config.upload.maxFileSizeBytes,
  files: config.upload.maxFilesPerRequest,
};

export function createMemoryUpload(options?: multer.Options) {
  return multer({
    storage: multer.memoryStorage(),
    limits: uploadLimits,
    ...options,
  });
}

export function formatUploadError(err: unknown): string {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return `File exceeds maximum size of ${config.upload.maxFileSizeMb} MB`;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return `Too many files — maximum ${config.upload.maxFilesPerRequest} per upload`;
    }
    return err.message;
  }
  return err instanceof Error ? err.message : 'File upload failed';
}
