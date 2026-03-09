import { getDb } from '@/lib/db';
import { AppError, ErrorCode } from '@/types/error';
import type {
  Category,
  CategoryRow,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/types/menu';
import { deleteImage } from '@/lib/upload';

/**
 * DB row → Category 변환
 */
function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

/**
 * 카테고리 목록 조회
 */
export function getCategories(storeId: number): Category[] {
  const db = getDb();
  const rows = db
    .prepare(
      'SELECT * FROM category WHERE store_id = ? ORDER BY sort_order ASC, id ASC'
    )
    .all(storeId) as CategoryRow[];

  return rows.map(toCategory);
}

/**
 * 카테고리 단건 조회 (내부용)
 */
function getCategoryById(categoryId: number): CategoryRow | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM category WHERE id = ?')
    .get(categoryId) as CategoryRow | undefined;
}

/**
 * 카테고리명 유효성 검증
 */
function validateCategoryName(name: string): void {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 50) {
    throw new AppError(
      ErrorCode.INVALID_CATEGORY_NAME,
      '카테고리명은 1~50자여야 합니다.'
    );
  }
}

/**
 * 카테고리명 중복 확인
 */
function checkDuplicateName(
  storeId: number,
  name: string,
  excludeId?: number
): void {
  const db = getDb();
  const trimmed = name.trim();

  let row;
  if (excludeId) {
    row = db
      .prepare(
        'SELECT id FROM category WHERE store_id = ? AND name = ? AND id != ?'
      )
      .get(storeId, trimmed, excludeId);
  } else {
    row = db
      .prepare('SELECT id FROM category WHERE store_id = ? AND name = ?')
      .get(storeId, trimmed);
  }

  if (row) {
    throw new AppError(
      ErrorCode.DUPLICATE_CATEGORY_NAME,
      `이미 존재하는 카테고리명입니다: ${trimmed}`
    );
  }
}

/**
 * 카테고리 등록
 */
export function createCategory(input: CreateCategoryInput): Category {
  const db = getDb();
  const { storeId, name, sortOrder } = input;

  // [1] 입력 검증
  validateCategoryName(name);

  // [2] 중복 확인
  checkDuplicateName(storeId, name);

  // [3] sortOrder 자동 계산
  let finalSortOrder = sortOrder;
  if (finalSortOrder === undefined) {
    const maxRow = db
      .prepare(
        'SELECT MAX(sort_order) as max_order FROM category WHERE store_id = ?'
      )
      .get(storeId) as { max_order: number | null };
    finalSortOrder = (maxRow.max_order ?? 0) + 1;
  }

  // [4] INSERT
  const result = db
    .prepare(
      'INSERT INTO category (store_id, name, sort_order) VALUES (?, ?, ?)'
    )
    .run(storeId, name.trim(), finalSortOrder);

  // [5] 생성된 카테고리 반환
  const created = getCategoryById(Number(result.lastInsertRowid));
  return toCategory(created!);
}

/**
 * 카테고리 수정
 */
export function updateCategory(
  categoryId: number,
  input: UpdateCategoryInput
): Category {
  const db = getDb();

  // [1] 기존 카테고리 조회
  const existing = getCategoryById(categoryId);
  if (!existing) {
    throw new AppError(
      ErrorCode.CATEGORY_NOT_FOUND,
      '카테고리를 찾을 수 없습니다.'
    );
  }

  // [2] name 변경 시 검증 + 중복 확인
  if (input.name !== undefined) {
    validateCategoryName(input.name);
    checkDuplicateName(existing.store_id, input.name, categoryId);
  }

  // [3] sortOrder 검증
  if (input.sortOrder !== undefined && input.sortOrder < 0) {
    throw new AppError(
      ErrorCode.INVALID_SORT_ORDER,
      '정렬 순서는 0 이상이어야 합니다.'
    );
  }

  // [4] UPDATE
  const newName = input.name?.trim() ?? existing.name;
  const newSortOrder = input.sortOrder ?? existing.sort_order;

  db.prepare(
    'UPDATE category SET name = ?, sort_order = ? WHERE id = ?'
  ).run(newName, newSortOrder, categoryId);

  const updated = getCategoryById(categoryId);
  return toCategory(updated!);
}

/**
 * 카테고리 삭제
 */
export async function deleteCategory(categoryId: number): Promise<void> {
  const db = getDb();

  // [1] 기존 카테고리 조회
  const existing = getCategoryById(categoryId);
  if (!existing) {
    throw new AppError(
      ErrorCode.CATEGORY_NOT_FOUND,
      '카테고리를 찾을 수 없습니다.'
    );
  }

  // [2] 하위 메뉴의 주문 참조 확인
  const orderRef = db
    .prepare(
      `SELECT COUNT(*) as cnt FROM order_item oi
       JOIN menu_item mi ON oi.menu_item_id = mi.id
       WHERE mi.category_id = ?`
    )
    .get(categoryId) as { cnt: number };

  if (orderRef.cnt > 0) {
    throw new AppError(
      ErrorCode.CATEGORY_HAS_ORDERS,
      '주문에 참조된 메뉴가 있어 카테고리를 삭제할 수 없습니다.'
    );
  }

  // [3] 하위 메뉴 이미지 파일 일괄 삭제
  const menuItems = db
    .prepare('SELECT image_path FROM menu_item WHERE category_id = ?')
    .all(categoryId) as { image_path: string | null }[];

  for (const item of menuItems) {
    if (item.image_path) {
      await deleteImage(item.image_path);
    }
  }

  // [4] CASCADE 삭제 (category → menu_item)
  db.prepare('DELETE FROM menu_item WHERE category_id = ?').run(categoryId);
  db.prepare('DELETE FROM category WHERE id = ?').run(categoryId);
}
