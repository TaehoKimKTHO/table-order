# Unit 3: 메뉴 관리 - 비즈니스 규칙 정의

## 1. Unit 3 규칙 범위

Unit 1에서 정의된 전체 시스템 비즈니스 규칙 중 Unit 3(Menu Module, Upload Module)에 해당하는 규칙을 상세화합니다.

---

## 2. 검증 규칙 (Validation Rules)

### VR-04: 카테고리 (Category) — Unit 1 참조 + 상세화

| 규칙 ID | 필드 | 규칙 | 에러 코드 | 적용 메서드 |
|---|---|---|---|---|
| VR-04-01 | name | 1~50자, 공백만으로 구성 불가 | INVALID_CATEGORY_NAME | createCategory, updateCategory |
| VR-04-02 | name | 매장 내 중복 불가 | DUPLICATE_CATEGORY_NAME | createCategory, updateCategory |
| VR-04-03 | sort_order | 0 이상 정수 | INVALID_SORT_ORDER | createCategory, updateCategory |

### VR-05: 메뉴 (MenuItem) — Unit 1 참조 + 상세화

| 규칙 ID | 필드 | 규칙 | 에러 코드 | 적용 메서드 |
|---|---|---|---|---|
| VR-05-01 | name | 1~100자 | INVALID_MENU_NAME | createMenuItem, updateMenuItem |
| VR-05-02 | price | 100원 이상, 10,000,000원 이하 | INVALID_PRICE | createMenuItem, updateMenuItem |
| VR-05-03 | description | 0~500자 | INVALID_DESCRIPTION | createMenuItem, updateMenuItem |
| VR-05-04 | category_id | 존재하는 카테고리 참조 | CATEGORY_NOT_FOUND | createMenuItem, updateMenuItem |
| VR-05-05 | image | 허용 형식: jpg, jpeg, png, webp | INVALID_IMAGE_FORMAT | uploadImage |
| VR-05-06 | image | 최대 5MB | IMAGE_TOO_LARGE | uploadImage |

---

## 3. 데이터 무결성 규칙 (Unit 3 관점)

### DIR-01: 참조 무결성

| 규칙 ID | 규칙 | 적용 메서드 | 설명 |
|---|---|---|---|
| DIR-01-01 | 카테고리 삭제 시 하위 메뉴 CASCADE 삭제 | deleteCategory | DB CASCADE + 이미지 파일 삭제 |
| DIR-01-04 | 주문 참조 존재 시 카테고리 삭제 불가 | deleteCategory | order_item.menu_item_id 참조 확인 |

### DIR-04: 파일 무결성 (Unit 3 신규)

| 규칙 ID | 규칙 | 적용 메서드 | 설명 |
|---|---|---|---|
| DIR-04-01 | 메뉴 삭제 시 이미지 파일 함께 삭제 | deleteMenuItem | DB 삭제 전 파일 삭제 |
| DIR-04-02 | 메뉴 이미지 교체 시 기존 파일 삭제 | updateMenuItem | 새 이미지 업로드 후 기존 파일 삭제 |
| DIR-04-03 | 카테고리 삭제 시 하위 메뉴 이미지 일괄 삭제 | deleteCategory | CASCADE 전 이미지 파일 정리 |
| DIR-04-04 | 이미지 삭제는 멱등적 | deleteImage | 파일 미존재 시 에러 없이 무시 |

---

## 4. 비즈니스 로직 규칙

### BLR-01: 메뉴 조회 규칙

| 규칙 ID | 규칙 | 설명 |
|---|---|---|
| BLR-01-01 | 고객용 조회는 is_available=1만 반환 | getMenuItems (고객 API에서 호출 시) |
| BLR-01-02 | 관리자용 조회는 전체 반환 | getAllMenuItems (관리자 API에서 호출 시) |
| BLR-01-03 | 메뉴 정렬: sort_order ASC, id ASC | 동일 sort_order 시 id 순 |
| BLR-01-04 | 카테고리 정렬: sort_order ASC, id ASC | 동일 sort_order 시 id 순 |

### BLR-02: 자동 순서 할당 규칙

| 규칙 ID | 규칙 | 설명 |
|---|---|---|
| BLR-02-01 | 메뉴 생성 시 sort_order 미지정이면 자동 할당 | 카테고리 내 MAX(sort_order) + 1 |
| BLR-02-02 | 카테고리 생성 시 sort_order 미지정이면 자동 할당 | 매장 내 MAX(sort_order) + 1 |

### BLR-03: 이미지 관리 규칙

| 규칙 ID | 규칙 | 설명 |
|---|---|---|
| BLR-03-01 | 이미지는 선택 사항 | 메뉴 등록/수정 시 이미지 없이도 가능 |
| BLR-03-02 | 파일명은 UUID v4로 생성 | 충돌 방지, 원본 파일명 미사용 |
| BLR-03-03 | 이미지 교체 시 기존 파일 삭제 후 새 파일 저장 | 고아 파일 방지 |
| BLR-03-04 | 저장 경로: public/uploads/menu/ | Next.js 정적 파일 서빙 활용 |

---

## 5. 에러 코드 (Unit 3 관련)

Unit 1에서 정의된 에러 코드 중 Unit 3에서 사용하는 코드:

| 에러 코드 | HTTP 상태 | 설명 | 발생 메서드 |
|---|---|---|---|
| INVALID_CATEGORY_NAME | 400 | 유효하지 않은 카테고리명 | createCategory, updateCategory |
| DUPLICATE_CATEGORY_NAME | 409 | 중복된 카테고리명 | createCategory, updateCategory |
| INVALID_SORT_ORDER | 400 | 유효하지 않은 정렬 순서 | updateMenuOrder |
| INVALID_MENU_NAME | 400 | 유효하지 않은 메뉴명 | createMenuItem, updateMenuItem |
| INVALID_PRICE | 400 | 유효하지 않은 가격 | createMenuItem, updateMenuItem |
| INVALID_DESCRIPTION | 400 | 유효하지 않은 설명 | createMenuItem, updateMenuItem |
| CATEGORY_NOT_FOUND | 404 | 카테고리를 찾을 수 없음 | createMenuItem, updateMenuItem, updateCategory, deleteCategory |
| INVALID_IMAGE_FORMAT | 400 | 허용되지 않은 이미지 형식 | uploadImage |
| IMAGE_TOO_LARGE | 400 | 이미지 크기 초과 | uploadImage |
| MENU_NOT_FOUND | 404 | 메뉴를 찾을 수 없음 | getMenuItem, updateMenuItem, deleteMenuItem, updateMenuOrder |

### Unit 3 신규 에러 코드

| 에러 코드 | HTTP 상태 | 설명 | 발생 메서드 |
|---|---|---|---|
| CATEGORY_HAS_ORDERS | 409 | 주문에 참조된 메뉴가 있어 카테고리 삭제 불가 | deleteCategory |
| IMAGE_UPLOAD_FAILED | 500 | 이미지 파일 저장 실패 | uploadImage |

### 에러 응답 형식

```json
{
  "error": {
    "code": "INVALID_MENU_NAME",
    "message": "메뉴명은 1~100자여야 합니다."
  }
}
```
