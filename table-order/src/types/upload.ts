/**
 * Upload Module 타입 정의
 */

/** 허용되는 이미지 MIME 타입 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

/** 허용되는 이미지 확장자 */
export const ALLOWED_IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
] as const;

/** 최대 이미지 크기 (5MB) */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** 이미지 업로드 디렉토리 */
export const UPLOAD_DIR = 'public/uploads/menu';

/** 이미지 서빙 기본 경로 */
export const UPLOAD_SERVE_PATH = '/uploads/menu';

export interface UploadResult {
  filePath: string;
  filename: string;
}
