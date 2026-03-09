import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../category';

/**
 * 카테고리 CRUD 단위 테스트
 *
 * 참고: 이 테스트는 Unit 1의 Database Module이 구현된 후 실행 가능합니다.
 * getDb()가 초기화된 SQLite 인스턴스를 반환해야 합니다.
 * 테스트 실행 전 DB 초기화 및 시드 데이터가 필요합니다.
 */
describe('Category CRUD', () => {
  // Unit 1 DB 모듈 구현 후 beforeEach에서 DB 초기화 필요
  // beforeEach(() => { initializeDb(); seedData(); });

  describe('getCategories', () => {
    it('매장의 카테고리 목록을 sort_order 순으로 반환한다', () => {
      // Unit 1 시드 데이터: storeId=1, 카테고리 3개 (메인 메뉴, 사이드 메뉴, 음료)
      const categories = getCategories(1);
      expect(categories).toBeInstanceOf(Array);
      expect(categories.length).toBeGreaterThanOrEqual(3);
      expect(categories[0].sortOrder).toBeLessThanOrEqual(categories[1].sortOrder);
    });

    it('존재하지 않는 매장은 빈 배열을 반환한다', () => {
      const categories = getCategories(9999);
      expect(categories).toEqual([]);
    });
  });

  describe('createCategory', () => {
    it('새 카테고리를 생성한다', () => {
      const category = createCategory({
        storeId: 1,
        name: '디저트',
      });

      expect(category.name).toBe('디저트');
      expect(category.storeId).toBe(1);
      expect(category.id).toBeGreaterThan(0);
      expect(category.sortOrder).toBeGreaterThan(0);
    });

    it('sortOrder를 지정하여 생성한다', () => {
      const category = createCategory({
        storeId: 1,
        name: '특선 메뉴',
        sortOrder: 10,
      });

      expect(category.sortOrder).toBe(10);
    });

    it('빈 이름은 에러를 발생시킨다', () => {
      expect(() =>
        createCategory({ storeId: 1, name: '' })
      ).toThrow('카테고리명은 1~50자');
    });

    it('50자 초과 이름은 에러를 발생시킨다', () => {
      expect(() =>
        createCategory({ storeId: 1, name: 'a'.repeat(51) })
      ).toThrow('카테고리명은 1~50자');
    });

    it('중복 이름은 에러를 발생시킨다', () => {
      // 시드 데이터에 '메인 메뉴' 존재
      expect(() =>
        createCategory({ storeId: 1, name: '메인 메뉴' })
      ).toThrow('이미 존재하는 카테고리명');
    });
  });

  describe('updateCategory', () => {
    it('카테고리명을 수정한다', () => {
      const created = createCategory({ storeId: 1, name: '수정 테스트' });
      const updated = updateCategory(created.id, { name: '수정됨' });

      expect(updated.name).toBe('수정됨');
    });

    it('존재하지 않는 카테고리는 에러를 발생시킨다', () => {
      expect(() =>
        updateCategory(9999, { name: '없는 카테고리' })
      ).toThrow('카테고리를 찾을 수 없습니다');
    });

    it('음수 sortOrder는 에러를 발생시킨다', () => {
      const created = createCategory({ storeId: 1, name: '순서 테스트' });
      expect(() =>
        updateCategory(created.id, { sortOrder: -1 })
      ).toThrow('정렬 순서는 0 이상');
    });
  });

  describe('deleteCategory', () => {
    it('카테고리를 삭제한다', async () => {
      const created = createCategory({ storeId: 1, name: '삭제 테스트' });
      await deleteCategory(created.id);

      const categories = getCategories(1);
      const found = categories.find((c) => c.id === created.id);
      expect(found).toBeUndefined();
    });

    it('존재하지 않는 카테고리 삭제는 에러를 발생시킨다', async () => {
      await expect(deleteCategory(9999)).rejects.toThrow(
        '카테고리를 찾을 수 없습니다'
      );
    });
  });
});
