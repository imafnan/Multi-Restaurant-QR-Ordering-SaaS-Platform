import fs from 'fs';
import path from 'path';

export interface IStorageService {
  uploadFile(file: Express.Multer.File): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
}

export class LocalStorageService implements IStorageService {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    const destPath = path.join(this.uploadDir, filename);

    // Save the file
    await fs.promises.writeFile(destPath, file.buffer);

    // Return static URL
    return `/uploads/${filename}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;
    // Extract filename from URL (assuming format /uploads/filename)
    const parts = fileUrl.split('/uploads/');
    if (parts.length < 2) return;
    const filename = parts[1];
    const filePath = path.join(this.uploadDir, filename);

    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete local file: ${filePath}`, error);
    }
  }
}

// In the future, swap this with R2StorageService
export class R2StorageService implements IStorageService {
  async uploadFile(file: Express.Multer.File): Promise<string> {
    // Placeholder implementation for Cloudflare R2
    throw new Error('R2StorageService not implemented yet');
  }

  async deleteFile(fileUrl: string): Promise<void> {
    throw new Error('R2StorageService not implemented yet');
  }
}

// Export active storage service based on environment settings
export const storageService: IStorageService = new LocalStorageService();
