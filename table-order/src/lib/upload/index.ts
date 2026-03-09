import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { AppError, ErrorCode } from '@/types/error';
import {
  ALLOWED_IMAGE_EXTENSIONS,
  MAX_IMAGE_SIZE,
  UPLOAD_DIR,
  UPLOAD_SERVE_PATH,
  type UploadResult,
} from '@/types/upload';

/**
 * 파일 확장자 추출
 */
function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

/**
 * MIME 타입에서 확장자 추출
 */
function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return map[mimeType] ?? '';
}

/**
 * 업로드 디렉토리 확인 및 생성
 */
async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

/**
 * 이미지 파일 업로드
 *
 * @param buffer - 파일 데이터 (Buffer)
 * @param originalFilename - 원본 파일명
 * @param mimeType - MIME 타입 (optional, 파일명에서 추출 가능)
 * @returns 저장된 파일 경로 정보
 */
export async function uploadImage(
  buffer: Buffer,
  originalFilename: string,
  mimeType?: string
): Promise<UploadResult> {
  // [1] 파일 형식 검증
  const ext = mimeType
    ? getExtensionFromMime(mimeType)
    : getExtension(originalFilename);

  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext as typeof ALLOWED_IMAGE_EXTENSIONS[number])) {
    throw new AppError(
      ErrorCode.INVALID_IMAGE_FORMAT,
      `허용되지 않은 이미지 형식입니다. 허용: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`
    );
  }

  // [2] 파일 크기 검증
  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new AppError(
      ErrorCode.IMAGE_TOO_LARGE,
      `이미지 크기가 5MB를 초과합니다. (${(buffer.length / 1024 / 1024).toFixed(1)}MB)`
    );
  }

  // [3] 고유 파일명 생성
  const filename = `${randomUUID()}.${ext}`;

  // [4] 저장 디렉토리 확인/생성
  await ensureUploadDir();

  // [5] 파일 저장
  const fullPath = path.join(UPLOAD_DIR, filename);
  try {
    await fs.writeFile(fullPath, buffer);
  } catch {
    throw new AppError(
      ErrorCode.IMAGE_UPLOAD_FAILED,
      '이미지 파일 저장에 실패했습니다.'
    );
  }

  // [6] 저장 경로 반환
  const filePath = `${UPLOAD_SERVE_PATH}/${filename}`;
  return { filePath, filename };
}

/**
 * 이미지 파일 삭제 (멱등적)
 *
 * @param filePath - 서빙 경로 (예: "/uploads/menu/abc123.jpg")
 */
export async function deleteImage(filePath: string): Promise<void> {
  // [1] 서빙 경로 → 파일 시스템 경로 변환
  const fullPath = path.join('public', filePath);

  // [2] 파일 존재 확인 후 삭제 (없으면 무시)
  try {
    await fs.access(fullPath);
    await fs.unlink(fullPath);
  } catch {
    // 파일이 없으면 무시 (멱등성)
  }
}

/**
 * 이미지 서빙 경로 반환
 *
 * @param filename - 파일명
 * @returns 서빙 경로
 */
export function getImagePath(filename: string): string {
  return `${UPLOAD_SERVE_PATH}/${filename}`;
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
