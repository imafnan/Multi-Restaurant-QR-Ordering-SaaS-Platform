"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = exports.R2StorageService = exports.LocalStorageService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class LocalStorageService {
    constructor() {
        this.uploadDir = path_1.default.join(__dirname, '../../uploads');
        this.baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        if (!fs_1.default.existsSync(this.uploadDir)) {
            fs_1.default.mkdirSync(this.uploadDir, { recursive: true });
        }
    }
    async uploadFile(file) {
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path_1.default.extname(file.originalname)}`;
        const destPath = path_1.default.join(this.uploadDir, filename);
        // Save the file
        await fs_1.default.promises.writeFile(destPath, file.buffer);
        // Return static URL
        return `/uploads/${filename}`;
    }
    async deleteFile(fileUrl) {
        if (!fileUrl)
            return;
        // Extract filename from URL (assuming format /uploads/filename)
        const parts = fileUrl.split('/uploads/');
        if (parts.length < 2)
            return;
        const filename = parts[1];
        const filePath = path_1.default.join(this.uploadDir, filename);
        try {
            if (fs_1.default.existsSync(filePath)) {
                await fs_1.default.promises.unlink(filePath);
            }
        }
        catch (error) {
            console.error(`Failed to delete local file: ${filePath}`, error);
        }
    }
}
exports.LocalStorageService = LocalStorageService;
// In the future, swap this with R2StorageService
class R2StorageService {
    async uploadFile(file) {
        // Placeholder implementation for Cloudflare R2
        throw new Error('R2StorageService not implemented yet');
    }
    async deleteFile(fileUrl) {
        throw new Error('R2StorageService not implemented yet');
    }
}
exports.R2StorageService = R2StorageService;
// Export active storage service based on environment settings
exports.storageService = new LocalStorageService();
