import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export class LocalFileStorage {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    const fileId = randomUUID();
    const extension = path.extname(file.originalname);
    const filename = `${fileId}${extension}`;
    const filePath = path.join(this.uploadDir, filename);

    fs.writeFileSync(filePath, file.buffer);
    
    return filename;
  }

  async getFile(filename: string): Promise<Buffer | null> {
    const filePath = path.join(this.uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    return fs.readFileSync(filePath);
  }

  async deleteFile(filename: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    
    return false;
  }

  async listFiles(): Promise<string[]> {
    if (!fs.existsSync(this.uploadDir)) {
      return [];
    }
    
    return fs.readdirSync(this.uploadDir);
  }
}

export const localStorage = new LocalFileStorage();