# Unit 3: 메뉴 관리 - 비즈니스 로직 모델

## 1. Unit 3 모듈 범위

Unit 3은 Menu Module과 Upload Module을 포함합니다. 메뉴/카테고리의 전체 CRUD 비즈니스 로직과 이미지 파일 관리를 담당합니다.

---

## 2. Menu Module 비즈니스 로직

### 2.1 카테고리 목록 조회 (getCategories)

```
입력: storeId
  |
  v
[1] store_id로 카테고리 목록 조회
  |-- ORDER BY sort_order ASC, id ASC
  v
[2] 응답 반환
  |-- Category[] (id, name, sortOrder, createdAt)
```

**데이터 흐름:**
- 입력: `{ storeId: number }`
- 출력: `Category[]`
- DB 조회: category WHERE store_id = ?

### 2.2 카테고리별 메뉴 조회 (getMenuItems)

```
입력: categoryId
  |
  v
[1] category_id로 메뉴 목록 조회
  |-- WHERE is_available = 1 (판매 가능한 메뉴만)
  |-- ORDER BY sort_order ASC, id ASC
  v
[2] 응답 반환
  |-- MenuItem[] (id, name, price, description, imagePath, sortOrder)
```

**데이터 흐름:**
- 입력: `{ categoryId: number }`
- 출력: `MenuItem[]`
- DB 조회: menu_item WHERE category_id = ? AND is_available = 1

**참고**: 고객용 조회에서는 is_available=1만 반환. 관리자용 조회는 getAllMenuItems에서 전체 반환.

### 2.3 매장 전체 메뉴 조회 (getAllMenuItems)

```
입력: storeId
  |
  v
[1] store_id에 속한 카테고리 목록 조회
  v
[2] 각 카테고리별 메뉴 목록 조회 (전체, is_available 무관)
  |-- JOIN category ON menu_item.category_id = category.id
  |-- WHERE category.store_id = ?
  |-- ORDER BY category.sort_order ASC, menu_item.sort_order ASC
  v
[3] 카테고리별 그룹핑하여 응답 반환
  |-- { categories: [{ ...category, items: MenuItem[] }] }
```

**데이터 흐름:**
- 입력: `{ storeId: number }`
- 출력: `{ categories: CategoryWithItems[] }`
- DB 조회: category JOIN menu_item

### 2.4 메뉴 상세 조회 (getMenuItem)

```
입력: menuItemId
  |
  v
[1] id로 메뉴 조회
  |-- 없음 → Error: MENU_NOT_FOUND
  v
[2] 카테고리 정보 JOIN
  v
[3] 응답 반환
  |-- MenuItem (id, name, price, description, imagePath, categoryId, categoryName, sortOrder, isAvailable)
```

### 2.5 메뉴 등록 (createMenuItem)

```
입력: name, price, description, categoryId, image (optional)
  |
  v
[1] 입력 검증
  |-- name: 1~100자 → INVALID_MENU_NAME
  |-- price: 100~10,000,000 → INVALID_PRICE
  |-- description: 0~500자 → INVALID_DESCRIPTION
  v
[2] 카테고리 존재 확인
  |-- 없음 → Error: CATEGORY_NOT_FOUND
  v
[3] 이미지 처리 (image가 있는 경우)
  |-- Upload.uploadImage(image) → imagePath
  |-- 업로드 실패 → Error 전파
  v
[4] sort_order 자동 계산
  |-- 해당 카테고리 내 MAX(sort_order) + 1
  v
[5] menu_item INSERT
  |-- created_at, updated_at = now()
  v
[6] 생성된 MenuItem 반환
```

**데이터 흐름:**
- 입력: `{ name, price, description?, categoryId, image?: File }`
- 출력: `MenuItem`
- DB 쓰기: menu_item INSERT
- 파일 쓰기: Upload.uploadImage() (조건부)

### 2.6 메뉴 수정 (updateMenuItem)

```
입력: menuItemId, updateData (name?, price?, description?, categoryId?, image?, isAvailable?)
  |
  v
[1] 기존 메뉴 조회
  |-- 없음 → Error: MENU_NOT_FOUND
  v
[2] 변경 필드 검증 (제공된 필드만)
  |-- name: 1~100자 → INVALID_MENU_NAME
  |-- price: 100~10,000,000 → INVALID_PRICE
  |-- description: 0~500자 → INVALID_DESCRIPTION
  |-- categoryId: 존재 확인 → CATEGORY_NOT_FOUND
  v
[3] 이미지 교체 처리 (새 image가 있는 경우)
  |-- 기존 imagePath가 있으면 → Upload.deleteImage(기존 imagePath)
  |-- Upload.uploadImage(새 image) → 새 imagePath
  v
[4] menu_item UPDATE (변경된 필드만)
  |-- updated_at = now()
  v
[5] 수정된 MenuItem 반환
```

### 2.7 메뉴 삭제 (deleteMenuItem)

```
입력: menuItemId
  |
  v
[1] 기존 메뉴 조회
  |-- 없음 → Error: MENU_NOT_FOUND
  v
[2] 이미지 파일 삭제 (imagePath가 있는 경우)
  |-- Upload.deleteImage(imagePath)
  v
[3] menu_item DELETE
  |-- 관련 order_item은 menu_item_id 참조 유지 (스냅샷 데이터로 독립)
  v
[4] 성공 응답
```

**참고**: OrderItem은 menu_name, unit_price를 스냅샷으로 저장하므로 메뉴 삭제가 기존 주문에 영향을 주지 않음.

### 2.8 메뉴 순서 변경 (updateMenuOrder)

```
입력: menuItemId, sortOrder
  |
  v
[1] 메뉴 존재 확인
  |-- 없음 → Error: MENU_NOT_FOUND
  v
[2] sortOrder 검증
  |-- 0 미만 → Error: INVALID_SORT_ORDER
  v
[3] menu_item UPDATE sort_order
  |-- updated_at = now()
  v
[4] 성공 응답
```

### 2.9 카테고리 등록 (createCategory)

```
입력: storeId, name, sortOrder (optional)
  |
  v
[1] 입력 검증
  |-- name: 1~50자 → INVALID_CATEGORY_NAME
  v
[2] 매장 내 카테고리명 중복 확인
  |-- 중복 → Error: DUPLICATE_CATEGORY_NAME
  v
[3] sortOrder 자동 계산 (미제공 시)
  |-- MAX(sort_order) + 1
  v
[4] category INSERT
  v
[5] 생성된 Category 반환
```

### 2.10 카테고리 수정 (updateCategory)

```
입력: categoryId, updateData (name?, sortOrder?)
  |
  v
[1] 기존 카테고리 조회
  |-- 없음 → Error: CATEGORY_NOT_FOUND
  v
[2] name 변경 시 중복 확인
  |-- 동일 매장 내 중복 → Error: DUPLICATE_CATEGORY_NAME
  v
[3] category UPDATE (변경된 필드만)
  v
[4] 수정된 Category 반환
```

### 2.11 카테고리 삭제 (deleteCategory)

```
입력: categoryId
  |
  v
[1] 기존 카테고리 조회
  |-- 없음 → Error: CATEGORY_NOT_FOUND
  v
[2] 하위 메뉴의 주문 참조 확인
  |-- 해당 카테고리 메뉴가 order_item에 참조됨 → Error: CATEGORY_HAS_ORDERS
  v
[3] 하위 메뉴 이미지 파일 일괄 삭제
  |-- 각 메뉴의 imagePath에 대해 Upload.deleteImage() 호출
  v
[4] category DELETE (CASCADE로 하위 menu_item 자동 삭제)
  v
[5] 성공 응답
```

---

## 3. Upload Module 비즈니스 로직

### 3.1 이미지 업로드 (uploadImage)

```
입력: file (multipart form data)
  |
  v
[1] 파일 형식 검증
  |-- 허용: jpg, jpeg, png, webp
  |-- 불허 → Error: INVALID_IMAGE_FORMAT
  v
[2] 파일 크기 검증
  |-- 최대 5MB (5 * 1024 * 1024 bytes)
  |-- 초과 → Error: IMAGE_TOO_LARGE
  v
[3] 고유 파일명 생성
  |-- UUID v4 + 원본 확장자
  |-- 예: "a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg"
  v
[4] 저장 디렉토리 확인/생성
  |-- public/uploads/menu/ (없으면 생성)
  v
[5] 파일 저장
  |-- fs.writeFile(public/uploads/menu/{filename}, buffer)
  v
[6] 저장 경로 반환
  |-- "/uploads/menu/{filename}"
```

**데이터 흐름:**
- 입력: `File (multipart)`
- 출력: `string (filePath)`
- 파일 쓰기: `public/uploads/menu/{uuid}.{ext}`

### 3.2 이미지 삭제 (deleteImage)

```
입력: filePath (예: "/uploads/menu/abc123.jpg")
  |
  v
[1] 파일 경로를 실제 파일 시스템 경로로 변환
  |-- "public" + filePath → "public/uploads/menu/abc123.jpg"
  v
[2] 파일 존재 확인
  |-- 없음 → 무시 (에러 발생하지 않음, 멱등성)
  v
[3] 파일 삭제
  |-- fs.unlink(fullPath)
  v
[4] 성공 (void)
```

### 3.3 이미지 서빙 경로 반환 (getImagePath)

```
입력: filename
  |
  v
[1] 서빙 경로 생성
  |-- "/uploads/menu/" + filename
  v
[2] 경로 반환
```

**참고**: Next.js의 `public/` 디렉토리는 정적 파일로 자동 서빙되므로 별도 서빙 로직 불필요.
