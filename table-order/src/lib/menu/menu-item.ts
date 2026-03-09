import { getDb } from '@/lib/db';
import { AppError, ErrorCode } from '@/types/error';
import type {
  MenuItem,
  MenuItemDetail,
  MenuItemRow,
  CategoryWithItems,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  CategoryRow,
} from '@/types/menu';
import { uploadImage, deleteImage } from '@/lib/upload';

/**
 * DB row → MenuItem 변환
 */
function toMenuItem(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    price: row.price,
    description: row.description,
    imagePath: row.image_path,
    sortOrder: row.sort_order,
    isAvailable: row.is_available === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * DB row → MenuItemDetail 변환
 */
function toMenuItemDetail(row: MenuItemRow): MenuItemDetail {
  return {
    ...toMenuItem(row),
    categoryName: row.category_name ?? '',
  };
}

/**
 * 메뉴 입력 검증
 */
function validateMenuInput(input: {
  name?: string;
  price?: number;
  description?: string;
}): void {
  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (trimmed.length < 1 || trimmed.length > 100) {
      throw new AppError(
        ErrorCode.INVALID_MENU_NAME,
        '메뉴명은 1~100자여야 합니다.'
      );
    }
  }

  if (input.price !== undefined) {
    if (input.price < 100 || input.price > 10_000_000) {
      throw new AppError(
        ErrorCode.INVALID_PRICE,
        '가격은 100원 이상 10,000,000원 이하여야 합니다.'
      );
    }
  }

  if (input.description !== undefined) {
    if (input.description.length > 500) {
      throw new AppError(
        ErrorCode.INVALID_DESCRIPTION,
        '메뉴 설명은 500자 이하여야 합니다.'
      );
    }
  }
}

/**
 * 카테고리 존재 확인
 */
function ensureCategoryExists(categoryId: number): void {
  const db = getDb();
  const row = db
    .prepare('SELECT id FROM category WHERE id = ?')
    .get(categoryId);
  if (!row) {
    throw new AppError(
      ErrorCode.CATEGORY_NOT_FOUND,
      '카테고리를 찾을 수 없습니다.'
    );
  }
}

/**
 * 메뉴 단건 조회 (내부용)
 */
function getMenuItemRowById(menuItemId: number): MenuItemRow | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM menu_item WHERE id = ?')
    .get(menuItemId) as MenuItemRow | undefined;
}

/**
 * 카테고리별 메뉴 목록 조회 (판매 가능한 메뉴만)
 */
export function getMenuItems(categoryId: number): MenuItem[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM menu_item
       WHERE category_id = ? AND is_available = 1
       ORDER BY sort_order ASC, id ASC`
    )
    .all(categoryId) as MenuItemRow[];

  return rows.map(toMenuItem);
}

/**
 * 매장 전체 메뉴 조회 (카테고리별 그룹핑)
 */
export function getAllMenuItems(storeId: number): CategoryWithItems[] {
  const db = getDb();

  const categories = db
    .prepare(
      'SELECT * FROM category WHERE store_id = ? ORDER BY sort_order ASC, id ASC'
    )
    .all(storeId) as CategoryRow[];

  return categories.map((cat) => {
    const items = db
      .prepare(
        `SELECT * FROM menu_item
         WHERE category_id = ?
         ORDER BY sort_order ASC, id ASC`
      )
      .all(cat.id) as MenuItemRow[];

    return {
      id: cat.id,
      storeId: cat.store_id,
      name: cat.name,
      sortOrder: cat.sort_order,
      createdAt: cat.created_at,
      items: items.map(toMenuItem),
    };
  });
}

/**
 * 메뉴 상세 조회
 */
export function getMenuItem(menuItemId: number): MenuItemDetail {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT mi.*, c.name as category_name
       FROM menu_item mi
       JOIN category c ON mi.category_id = c.id
       WHERE mi.id = ?`
    )
    .get(menuItemId) as MenuItemRow | undefined;

  if (!row) {
    throw new AppError(
      ErrorCode.MENU_NOT_FOUND,
      '메뉴를 찾을 수 없습니다.'
    );
  }

  return toMenuItemDetail(row);
}

/**
 * 메뉴 등록
 */
export async function createMenuItem(
  input: CreateMenuItemInput
): Promise<MenuItem> {
  const db = getDb();

  // [1] 입력 검증
  validateMenuInput({
    name: input.name,
    price: input.price,
    description: input.description,
  });

  // [2] 카테고리 존재 확인
  ensureCategoryExists(input.categoryId);

  // [3] 이미지 처리
  let imagePath: string | null = null;
  if (input.image) {
    const buffer =
      input.image instanceof Buffer
        ? input.image
        : Buffer.from(await (input.image as File).arrayBuffer());
    const result = await uploadImage(
      buffer,
      'upload',
      input.imageMimeType
    );
    imagePath = result.filePath;
  }

  // [4] sort_order 자동 계산
  const maxRow = db
    .prepare(
      'SELECT MAX(sort_order) as max_order FROM menu_item WHERE category_id = ?'
    )
    .get(input.categoryId) as { max_order: number | null };
  const sortOrder = (maxRow.max_order ?? 0) + 1;

  // [5] INSERT
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO menu_item (category_id, name, price, description, image_path, sort_order, is_available, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
    )
    .run(
      input.categoryId,
      input.name.trim(),
      input.price,
      input.description?.trim() ?? '',
      imagePath,
      sortOrder,
      now,
      now
    );

  // [6] 생성된 메뉴 반환
  const created = getMenuItemRowById(Number(result.lastInsertRowid));
  return toMenuItem(created!);
}

/**
 * 메뉴 수정
 */
export async function updateMenuItem(
  menuItemId: number,
  input: UpdateMenuItemInput
): Promise<MenuItem> {
  const db = getDb();

  // [1] 기존 메뉴 조회
  const existing = getMenuItemRowById(menuItemId);
  if (!existing) {
    throw new AppError(
      ErrorCode.MENU_NOT_FOUND,
      '메뉴를 찾을 수 없습니다.'
    );
  }

  // [2] 변경 필드 검증
  validateMenuInput({
    name: input.name,
    price: input.price,
    description: input.description,
  });

  if (input.categoryId !== undefined) {
    ensureCategoryExists(input.categoryId);
  }

  // [3] 이미지 교체 처리
  let imagePath = existing.image_path;
  if (input.image) {
    // 기존 이미지 삭제
    if (existing.image_path) {
      await deleteImage(existing.image_path);
    }
    // 새 이미지 업로드
    const buffer =
      input.image instanceof Buffer
        ? input.image
        : Buffer.from(await (input.image as File).arrayBuffer());
    const result = await uploadImage(
      buffer,
      'upload',
      input.imageMimeType
    );
    imagePath = result.filePath;
  } else if (input.removeImage && existing.image_path) {
    await deleteImage(existing.image_path);
    imagePath = null;
  }

  // [4] UPDATE
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE menu_item
     SET name = ?, price = ?, description = ?, category_id = ?,
         image_path = ?, is_available = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    input.name?.trim() ?? existing.name,
    input.price ?? existing.price,
    input.description?.trim() ?? existing.description,
    input.categoryId ?? existing.category_id,
    imagePath,
    input.isAvailable !== undefined
      ? (input.isAvailable ? 1 : 0)
      : existing.is_available,
    now,
    menuItemId
  );

  // [5] 수정된 메뉴 반환
  const updated = getMenuItemRowById(menuItemId);
  return toMenuItem(updated!);
}

/**
 * 메뉴 삭제
 */
export async function deleteMenuItem(menuItemId: number): Promise<void> {
  const db = getDb();

  // [1] 기존 메뉴 조회
  const existing = getMenuItemRowById(menuItemId);
  if (!existing) {
    throw new AppError(
      ErrorCode.MENU_NOT_FOUND,
      '메뉴를 찾을 수 없습니다.'
    );
  }

  // [2] 이미지 파일 삭제
  if (existing.image_path) {
    await deleteImage(existing.image_path);
  }

  // [3] DELETE
  db.prepare('DELETE FROM menu_item WHERE id = ?').run(menuItemId);
}

/**
 * 메뉴 순서 변경
 */
export function updateMenuOrder(
  menuItemId: number,
  sortOrder: number
): void {
  const db = getDb();

  // [1] 메뉴 존재 확인
  const existing = getMenuItemRowById(menuItemId);
  if (!existing) {
    throw new AppError(
      ErrorCode.MENU_NOT_FOUND,
      '메뉴를 찾을 수 없습니다.'
    );
  }

  // [2] sortOrder 검증
  if (sortOrder < 0) {
    throw new AppError(
      ErrorCode.INVALID_SORT_ORDER,
      '정렬 순서는 0 이상이어야 합니다.'
    );
  }

  // [3] UPDATE
  const now = new Date().toISOString();
  db.prepare(
    'UPDATE menu_item SET sort_order = ?, updated_at = ? WHERE id = ?'
  ).run(sortOrder, now, menuItemId);
}
