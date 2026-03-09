import { describe, it, expect } from 'vitest';
import {
  getMenuItems,
  getAllMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateMenuOrder,
} from '../menu-item';

/**
 * 메뉴 CRUD 단위 테스트
 *
 * 참고: 이 테스트는 Unit 1의 Database Module이 구현된 후 실행 가능합니다.
 * getDb()가 초기화된 SQLite 인스턴스를 반환해야 합니다.
 * 테스트 실행 전 DB 초기화 및 시드 데이터가 필요합니다.
 */
describe('MenuItem CRUD', () => {
  // Unit 1 DB 모듈 구현 후 beforeEach에서 DB 초기화 필요

  describe('getMenuItems', () => {
    it('카테고리별 판매 가능한 메뉴를 반환한다', () => {
      // 시드 데이터: categoryId=1 (메인 메뉴) → 불고기, 김치찌개, 된장찌개
      const items = getMenuItems(1);
      expect(items).toBeInstanceOf(Array);
      expect(items.length).toBeGreaterThanOrEqual(3);
      items.forEach((item) => {
        expect(item.isAvailable).toBe(true);
      });
    });

    it('존재하지 않는 카테고리는 빈 배열을 반환한다', () => {
      const items = getMenuItems(9999);
      expect(items).toEqual([]);
    });
  });

  describe('getAllMenuItems', () => {
    it('매장 전체 메뉴를 카테고리별로 그룹핑하여 반환한다', () => {
      const result = getAllMenuItems(1);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(3);

      result.forEach((category) => {
        expect(category.name).toBeDefined();
        expect(category.items).toBeInstanceOf(Array);
      });
    });
  });

  describe('getMenuItem', () => {
    it('메뉴 상세 정보를 반환한다', () => {
      // 시드 데이터: menuItemId=1 (불고기)
      const item = getMenuItem(1);
      expect(item.name).toBe('불고기');
      expect(item.price).toBe(15000);
      expect(item.categoryName).toBeDefined();
    });

    it('존재하지 않는 메뉴는 에러를 발생시킨다', () => {
      expect(() => getMenuItem(9999)).toThrow('메뉴를 찾을 수 없습니다');
    });
  });

  describe('createMenuItem', () => {
    it('새 메뉴를 생성한다', async () => {
      const item = await createMenuItem({
        name: '테스트 메뉴',
        price: 10000,
        description: '테스트 설명',
        categoryId: 1,
      });

      expect(item.name).toBe('테스트 메뉴');
      expect(item.price).toBe(10000);
      expect(item.categoryId).toBe(1);
      expect(item.isAvailable).toBe(true);
      expect(item.sortOrder).toBeGreaterThan(0);
    });

    it('빈 이름은 에러를 발생시킨다', async () => {
      await expect(
        createMenuItem({ name: '', price: 10000, categoryId: 1 })
      ).rejects.toThrow('메뉴명은 1~100자');
    });

    it('100원 미만 가격은 에러를 발생시킨다', async () => {
      await expect(
        createMenuItem({ name: '저가 메뉴', price: 50, categoryId: 1 })
      ).rejects.toThrow('가격은 100원 이상');
    });

    it('10,000,000원 초과 가격은 에러를 발생시킨다', async () => {
      await expect(
        createMenuItem({ name: '고가 메뉴', price: 20_000_000, categoryId: 1 })
      ).rejects.toThrow('가격은 100원 이상');
    });

    it('존재하지 않는 카테고리는 에러를 발생시킨다', async () => {
      await expect(
        createMenuItem({ name: '메뉴', price: 10000, categoryId: 9999 })
      ).rejects.toThrow('카테고리를 찾을 수 없습니다');
    });

    it('500자 초과 설명은 에러를 발생시킨다', async () => {
      await expect(
        createMenuItem({
          name: '메뉴',
          price: 10000,
          categoryId: 1,
          description: 'a'.repeat(501),
        })
      ).rejects.toThrow('메뉴 설명은 500자 이하');
    });
  });

  describe('updateMenuItem', () => {
    it('메뉴 이름과 가격을 수정한다', async () => {
      const created = await createMenuItem({
        name: '수정 전',
        price: 5000,
        categoryId: 1,
      });

      const updated = await updateMenuItem(created.id, {
        name: '수정 후',
        price: 8000,
      });

      expect(updated.name).toBe('수정 후');
      expect(updated.price).toBe(8000);
    });

    it('존재하지 않는 메뉴는 에러를 발생시킨다', async () => {
      await expect(
        updateMenuItem(9999, { name: '없는 메뉴' })
      ).rejects.toThrow('메뉴를 찾을 수 없습니다');
    });

    it('판매 상태를 변경한다', async () => {
      const created = await createMenuItem({
        name: '상태 테스트',
        price: 5000,
        categoryId: 1,
      });

      const updated = await updateMenuItem(created.id, {
        isAvailable: false,
      });

      expect(updated.isAvailable).toBe(false);
    });
  });

  describe('deleteMenuItem', () => {
    it('메뉴를 삭제한다', async () => {
      const created = await createMenuItem({
        name: '삭제 대상',
        price: 5000,
        categoryId: 1,
      });

      await deleteMenuItem(created.id);

      expect(() => getMenuItem(created.id)).toThrow('메뉴를 찾을 수 없습니다');
    });

    it('존재하지 않는 메뉴 삭제는 에러를 발생시킨다', async () => {
      await expect(deleteMenuItem(9999)).rejects.toThrow(
        '메뉴를 찾을 수 없습니다'
      );
    });
  });

  describe('updateMenuOrder', () => {
    it('메뉴 순서를 변경한다', async () => {
      const created = await createMenuItem({
        name: '순서 테스트',
        price: 5000,
        categoryId: 1,
      });

      updateMenuOrder(created.id, 99);

      const item = getMenuItem(created.id);
      expect(item.sortOrder).toBe(99);
    });

    it('음수 순서는 에러를 발생시킨다', () => {
      expect(() => updateMenuOrder(1, -1)).toThrow('정렬 순서는 0 이상');
    });

    it('존재하지 않는 메뉴는 에러를 발생시킨다', () => {
      expect(() => updateMenuOrder(9999, 1)).toThrow(
        '메뉴를 찾을 수 없습니다'
      );
    });
  });
});
