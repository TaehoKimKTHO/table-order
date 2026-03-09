/**
 * Menu Module 타입 정의
 */

/** 카테고리 */
export interface Category {
  id: number;
  storeId: number;
  name: string;
  sortOrder: number;
  createdAt: string;
}

/** 메뉴 항목 */
export interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  price: number;
  description: string;
  imagePath: string | null;
  sortOrder: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 메뉴 상세 (카테고리 정보 포함) */
export interface MenuItemDetail extends MenuItem {
  categoryName: string;
}

/** 카테고리 + 메뉴 목록 */
export interface CategoryWithItems extends Category {
  items: MenuItem[];
}

/** 메뉴 생성 입력 */
export interface CreateMenuItemInput {
  name: string;
  price: number;
  description?: string;
  categoryId: number;
  image?: File | Buffer;
  imageMimeType?: string;
}

/** 메뉴 수정 입력 */
export interface UpdateMenuItemInput {
  name?: string;
  price?: number;
  description?: string;
  categoryId?: number;
  isAvailable?: boolean;
  image?: File | Buffer;
  imageMimeType?: string;
  removeImage?: boolean;
}

/** 카테고리 생성 입력 */
export interface CreateCategoryInput {
  storeId: number;
  name: string;
  sortOrder?: number;
}

/** 카테고리 수정 입력 */
export interface UpdateCategoryInput {
  name?: string;
  sortOrder?: number;
}

/** DB row → Category 매핑용 */
export interface CategoryRow {
  id: number;
  store_id: number;
  name: string;
  sort_order: number;
  created_at: string;
}

/** DB row → MenuItem 매핑용 */
export interface MenuItemRow {
  id: number;
  category_id: number;
  name: string;
  price: number;
  description: string;
  image_path: string | null;
  sort_order: number;
  is_available: number;
  created_at: string;
  updated_at: string;
  category_name?: string;
}
