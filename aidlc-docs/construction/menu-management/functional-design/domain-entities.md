# Unit 3: 메뉴 관리 - 도메인 엔티티 설계

## 1. Unit 3 엔티티 범위

Unit 3은 Unit 1에서 정의된 Category, MenuItem 엔티티를 사용합니다. 이 문서는 Unit 3 관점에서의 엔티티 활용 방식과 추가 제약조건을 정의합니다.

---

## 2. 사용 엔티티

### 2.1 Category (메뉴 카테고리)

**DDL**: Unit 1 `domain-entities.md` 참조

```sql
CREATE TABLE category (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id    INTEGER NOT NULL REFERENCES store(id),
  name        TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

**Unit 3 활용**:
- 조회: getCategories() — store_id 기준, sort_order ASC 정렬
- 생성: createCategory() — name 중복 검증, sort_order 자동 할당
- 수정: updateCategory() — name 변경 시 중복 검증
- 삭제: deleteCategory() — 하위 메뉴 CASCADE 삭제, 주문 참조 검증

### 2.2 MenuItem (메뉴 항목)

**DDL**: Unit 1 `domain-entities.md` 참조

```sql
CREATE TABLE menu_item (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id   INTEGER NOT NULL REFERENCES category(id),
  name          TEXT    NOT NULL,
  price         INTEGER NOT NULL,
  description   TEXT    DEFAULT '',
  image_path    TEXT    DEFAULT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_available  INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

**Unit 3 활용**:
- 조회: getMenuItems(), getAllMenuItems(), getMenuItem()
- 생성: createMenuItem() — 카테고리 존재 검증, 이미지 업로드 연동
- 수정: updateMenuItem() — 부분 업데이트, 이미지 교체 시 기존 이미지 삭제
- 삭제: deleteMenuItem() — 이미지 파일 함께 삭제
- 순서: updateMenuOrder() — sort_order 업데이트

---

## 3. 이미지 파일 관리 (Upload Module)

### 3.1 이미지 저장 구조

```
public/
  uploads/
    menu/
      {uuid}.{ext}     # 업로드된 메뉴 이미지
```

### 3.2 이미지 제약조건

| 항목 | 제약 |
|---|---|
| 허용 형식 | jpg, jpeg, png, webp |
| 최대 크기 | 5MB |
| 파일명 | UUID v4 + 원본 확장자 |
| 저장 경로 | `public/uploads/menu/` |
| 서빙 경로 | `/uploads/menu/{filename}` |

---

## 4. 엔티티 관계 (Unit 3 관점)

```
Category (카테고리)
  |
  +-- 1:N --> MenuItem (메뉴)
                |
                +-- image_path --> 파일 시스템 (public/uploads/menu/)
```

### 관계 규칙
- Category 삭제 시 하위 MenuItem CASCADE 삭제
- MenuItem 삭제 시 연결된 이미지 파일도 삭제
- MenuItem의 image_path는 NULL 허용 (이미지 없는 메뉴 가능)
