import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export async function uploadImage(file: File): Promise<string> {
  ensureUploadDir();

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw { code: 'INVALID_IMAGE_FORMAT', message: '허용되지 않은 이미지 형식입니다. (jpg, jpeg, png, webp)', status: 400 };
  }

  if (file.size > MAX_SIZE) {
    throw { code: 'IMAGE_TOO_LARGE', message: '이미지 크기가 5MB를 초과합니다.', status: 400 };
  }

  const filename = `${uuidv4()}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${filename}`;
}

export function deleteImage(imagePath: string): void {
  const fullPath = path.join(process.cwd(), 'public', imagePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

export function getImagePath(filename: string): string {
  return `/uploads/${filename}`;
}
