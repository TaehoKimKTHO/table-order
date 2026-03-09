import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { uploadImage, deleteImage, getImagePath } from '../index';
import { UPLOAD_DIR, UPLOAD_SERVE_PATH } from '@/types/upload';

describe('Upload Module', () => {
  // 테스트 후 업로드 디렉토리 정리
  const createdFiles: string[] = [];

  afterEach(async () => {
    for (const filePath of createdFiles) {
      try {
        await fs.unlink(path.join('public', filePath));
      } catch {
        // ignore
      }
    }
    createdFiles.length = 0;
  });

  describe('uploadImage', () => {
    it('유효한 JPG 이미지를 업로드한다', async () => {
      const buffer = Buffer.alloc(1024, 0xff);
      const result = await uploadImage(buffer, 'test.jpg', 'image/jpeg');

      expect(result.filePath).toMatch(/^\/uploads\/menu\/[\w-]+\.jpg$/);
      expect(result.filename).toMatch(/^[\w-]+\.jpg$/);
      createdFiles.push(result.filePath);

      // 파일이 실제로 존재하는지 확인
      const fullPath = path.join('public', result.filePath);
      const stat = await fs.stat(fullPath);
      expect(stat.size).toBe(1024);
    });

    it('유효한 PNG 이미지를 업로드한다', async () => {
      const buffer = Buffer.alloc(512, 0xff);
      const result = await uploadImage(buffer, 'test.png', 'image/png');

      expect(result.filePath).toMatch(/\.png$/);
      createdFiles.push(result.filePath);
    });

    it('유효한 WebP 이미지를 업로드한다', async () => {
      const buffer = Buffer.alloc(256, 0xff);
      const result = await uploadImage(buffer, 'test.webp', 'image/webp');

      expect(result.filePath).toMatch(/\.webp$/);
      createdFiles.push(result.filePath);
    });

    it('허용되지 않은 형식은 에러를 발생시킨다', async () => {
      const buffer = Buffer.alloc(100);
      await expect(
        uploadImage(buffer, 'test.gif', 'image/gif')
      ).rejects.toThrow('허용되지 않은 이미지 형식');
    });

    it('5MB 초과 이미지는 에러를 발생시킨다', async () => {
      const buffer = Buffer.alloc(6 * 1024 * 1024);
      await expect(
        uploadImage(buffer, 'large.jpg', 'image/jpeg')
      ).rejects.toThrow('5MB를 초과');
    });

    it('MIME 타입 없이 파일명에서 확장자를 추출한다', async () => {
      const buffer = Buffer.alloc(100);
      const result = await uploadImage(buffer, 'photo.jpeg');

      expect(result.filePath).toMatch(/\.jpeg$/);
      createdFiles.push(result.filePath);
    });
  });

  describe('deleteImage', () => {
    it('존재하는 이미지를 삭제한다', async () => {
      const buffer = Buffer.alloc(100);
      const result = await uploadImage(buffer, 'delete-me.jpg', 'image/jpeg');

      await deleteImage(result.filePath);

      const fullPath = path.join('public', result.filePath);
      await expect(fs.access(fullPath)).rejects.toThrow();
    });

    it('존재하지 않는 이미지 삭제는 에러 없이 무시한다', async () => {
      await expect(
        deleteImage('/uploads/menu/nonexistent.jpg')
      ).resolves.toBeUndefined();
    });
  });

  describe('getImagePath', () => {
    it('파일명으로 서빙 경로를 반환한다', () => {
      const result = getImagePath('abc123.jpg');
      expect(result).toBe(`${UPLOAD_SERVE_PATH}/abc123.jpg`);
    });
  });
});
