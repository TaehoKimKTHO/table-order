# Unit 1: 공통 API - 도메인 엔티티 설계

## 1. 엔티티 개요

Unit 1은 전체 시스템의 데이터 기반을 제공합니다. 7개 엔티티를 정의하며, 모든 유닛이 이 스키마를 공유합니다.

---

## 2. 엔티티 상세 정의

### 2.1 Store (매장)

```sql
CREATE TABLE store (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  store_code  TEXT    NOT NULL UNIQUE,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, AUTO INCREMENT | 매장 고유 ID |
| name | TEXT | NOT NULL | 매장명 (1~100자) |
| store_code | TEXT | NOT NULL, UNIQUE | 매장 식별 코드 (영숫자, 4~20자) |
| created_at | TEXT | NOT NULL, DEFAULT now | 생성 시각 (ISO 8601) |

**제약조건:**
- store_code는 영문 소문자 + 숫자 조합, 4~20자
- name은 공백 불가, 1~100자
- 단일 매장 운영 (시드 데이터로 1개 매장 생성)

---

### 2.2 RestaurantTable (테이블)

```sql
CREATE TABLE restaurant_table (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id      INTEGER NOT NULL REFERENCES store(id),
  table_number  INTEGER NOT NULL,
  is_occupied   INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(store_id, table_number)
);
```

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, AUTO INCREMENT | 테이블 고유 ID |
| store_id | INTEGER | FK → store(id), NOT NULL | 소속 매장 |
| table_number | INTEGER | NOT NULL, UNIQUE(store_id, table_number) | 테이블 번호 (1~99) |
| is_occupied | INTEGER | NOT NULL, DEFAULT 0 | 사용 중 여부 (0=빈 테이블, 1=사용중) |
| created_at | TEXT | NOT NULL, DEFAULT now | 생성 시각 |

**제약조건:**
- table_number: 1~99 범위, 매장 내 고유
- is_occupied: 활성 세션 존재 시 1, 세션 종료 시 0
- 로그인: 매장코드 + 테이블번호만으로 인증 (비밀번호 없음)

---

### 2.3 TableSession (테이블 세션)

```sql
CREATE TABLE table_session (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  table_id       INTEGER NOT NULL REFERENCES restaurant_table(id),
  session_token  TEXT    NOT NULL UNIQUE,
  started_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  ended_at       TEXT    DEFAULT NULL,
  status         TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed'))
);
```

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, AUTO INCREMENT | 세션 고유 ID |
| table_id | INTEGER | FK → restaurant_table(id), NOT NULL | 테이블 참조 |
| session_token | TEXT | NOT NULL, UNIQUE | 세션 식별 토큰 (UUID v4) |
| started_at | TEXT | NOT NULL, DEFAULT now | 세션 시작 시각 |
| ended_at | TEXT | DEFAULT NULL | 세션 종료 시각 (NULL=활성) |
| status | TEXT | NOT NULL, DEFAULT 'active', CHECK | 세션 상태 |

**제약조건:**
- session_token: UUID v4 형식
- 테이블당 활성 세션은 최대 1개 (status='active')
- ended_at이 NULL이면 활성 세션
- 세션 만료 없음 (관리자 이용 완료 처리 시에만 종료)

---

### 2.4 Category (메뉴 카테고리)

```sql
CREATE TABLE category (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id    INTEGER NOT NULL REFERENCES store(id),
  name        TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, AUTO INCREMENT | 카테고리 고유 ID |
| store_id | INTEGER | FK → store(id), NOT NULL | 소속 매장 |
| name | TEXT | NOT NULL | 카테고리명 (1~50자) |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | 표시 순서 (오름차순) |
| created_at | TEXT | NOT NULL, DEFAULT now | 생성 시각 |

**제약조건:**
- name: 1~50자, 매장 내 중복 불가
- sort_order: 0 이상 정수

---

### 2.5 MenuItem (메뉴 항목)

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

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, AUTO INCREMENT | 메뉴 고유 ID |
| category_id | INTEGER | FK → category(id), NOT NULL | 소속 카테고리 |
| name | TEXT | NOT NULL | 메뉴명 (1~100자) |
| price | INTEGER | NOT NULL | 가격 (원 단위, 100 이상) |
| description | TEXT | DEFAULT '' | 메뉴 설명 (0~500자) |
| image_path | TEXT | DEFAULT NULL | 이미지 파일 경로 |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | 카테고리 내 표시 순서 |
| is_available | INTEGER | NOT NULL, DEFAULT 1 | 판매 가능 여부 (0/1) |
| created_at | TEXT | NOT NULL, DEFAULT now | 생성 시각 |
| updated_at | TEXT | NOT NULL, DEFAULT now | 수정 시각 |

**제약조건:**
- price: 100원 이상, 10,000,000원 이하
- name: 1~100자
- description: 0~500자
- is_available: 0(판매중지) 또는 1(판매중)
- 카테고리 삭제 시 해당 메뉴도 함께 삭제 (CASCADE)

---

### 2.6 Order (주문)

```sql
CREATE TABLE "order" (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  table_id      INTEGER NOT NULL REFERENCES restaurant_table(id),
  session_id    INTEGER NOT NULL REFERENCES table_session(id),
  order_number  TEXT    NOT NULL UNIQUE,
  status        TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'preparing', 'completed')),
  total_amount  INTEGER NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, AUTO INCREMENT | 주문 고유 ID |
| table_id | INTEGER | FK → restaurant_table(id), NOT NULL | 주문 테이블 |
| session_id | INTEGER | FK → table_session(id), NOT NULL | 소속 세션 |
| order_number | TEXT | NOT NULL, UNIQUE | 주문 번호 (ORD-YYYYMMDD-XXXX) |
| status | TEXT | NOT NULL, DEFAULT 'pending', CHECK | 주문 상태 |
| total_amount | INTEGER | NOT NULL | 총 주문 금액 (원 단위) |
| created_at | TEXT | NOT NULL, DEFAULT now | 주문 시각 |
| updated_at | TEXT | NOT NULL, DEFAULT now | 상태 변경 시각 |

**제약조건:**
- order_number 형식: `ORD-YYYYMMDD-XXXX` (날짜 + 4자리 순번)
- status: pending(대기중) → preparing(준비중) → completed(완료)
- total_amount: 0 이상 (주문 항목 소계의 합)
- 활성 세션(status='active')에서만 주문 생성 가능

---

### 2.7 OrderItem (주문 항목)

```sql
CREATE TABLE order_item (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      INTEGER NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  menu_item_id  INTEGER NOT NULL REFERENCES menu_item(id),
  menu_name     TEXT    NOT NULL,
  quantity      INTEGER NOT NULL,
  unit_price    INTEGER NOT NULL,
  subtotal      INTEGER NOT NULL
);
```

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, AUTO INCREMENT | 주문 항목 고유 ID |
| order_id | INTEGER | FK → order(id), ON DELETE CASCADE | 소속 주문 |
| menu_item_id | INTEGER | FK → menu_item(id), NOT NULL | 메뉴 참조 |
| menu_name | TEXT | NOT NULL | 주문 시점 메뉴명 (스냅샷) |
| quantity | INTEGER | NOT NULL | 수량 (1 이상) |
| unit_price | INTEGER | NOT NULL | 주문 시점 단가 (스냅샷) |
| subtotal | INTEGER | NOT NULL | 소계 (quantity × unit_price) |

**제약조건:**
- quantity: 1 이상, 99 이하
- unit_price: 주문 시점의 메뉴 가격 스냅샷 (메뉴 가격 변경 영향 없음)
- subtotal = quantity × unit_price (계산 무결성)
- 주문 삭제 시 주문 항목도 함께 삭제 (CASCADE)

---

## 3. 엔티티 관계도

```
Store (매장)
  |
  +-- 1:N --> RestaurantTable (테이블)
  |             |
  |             +-- 1:N --> TableSession (세션)
  |             |             |
  |             |             +-- 1:N --> Order (주문)
  |             |                           |
  |             |                           +-- 1:N --> OrderItem (주문 항목)
  |             |                                         |
  |             +-- 1:N --> Order (테이블별 주문 조회용)    |
  |                                                       |
  +-- 1:N --> Category (카테고리)                          |
                |                                         |
                +-- 1:N --> MenuItem (메뉴) <-- N:1 -------+
```

### 관계 요약
| 관계 | 타입 | 설명 |
|---|---|---|
| Store → RestaurantTable | 1:N | 매장에 여러 테이블 |
| Store → Category | 1:N | 매장에 여러 카테고리 |
| RestaurantTable → TableSession | 1:N | 테이블에 여러 세션 (시간순) |
| RestaurantTable → Order | 1:N | 테이블에 여러 주문 |
| TableSession → Order | 1:N | 세션에 여러 주문 |
| Category → MenuItem | 1:N | 카테고리에 여러 메뉴 (CASCADE 삭제) |
| Order → OrderItem | 1:N | 주문에 여러 항목 (CASCADE 삭제) |
| MenuItem → OrderItem | 1:N | 메뉴가 여러 주문 항목에 참조됨 |

---

## 4. 인덱스 설계

```sql
-- 성능 최적화 인덱스
CREATE INDEX idx_restaurant_table_store ON restaurant_table(store_id);
CREATE INDEX idx_table_session_table ON table_session(table_id);
CREATE INDEX idx_table_session_status ON table_session(table_id, status);
CREATE INDEX idx_category_store ON category(store_id);
CREATE INDEX idx_category_sort ON category(store_id, sort_order);
CREATE INDEX idx_menu_item_category ON menu_item(category_id);
CREATE INDEX idx_menu_item_sort ON menu_item(category_id, sort_order);
CREATE INDEX idx_order_table ON "order"(table_id);
CREATE INDEX idx_order_session ON "order"(session_id);
CREATE INDEX idx_order_status ON "order"(status);
CREATE INDEX idx_order_item_order ON order_item(order_id);
```

---

## 5. 시드 데이터

```sql
-- 매장
INSERT INTO store (name, store_code) VALUES ('테스트 매장', 'store001');

-- 카테고리
INSERT INTO category (store_id, name, sort_order) VALUES
  (1, '메인 메뉴', 1),
  (1, '사이드 메뉴', 2),
  (1, '음료', 3);

-- 메뉴
INSERT INTO menu_item (category_id, name, price, description, sort_order) VALUES
  (1, '불고기', 15000, '양념 소불고기', 1),
  (1, '김치찌개', 9000, '돼지고기 김치찌개', 2),
  (1, '된장찌개', 8000, '두부 된장찌개', 3),
  (2, '계란말이', 7000, '치즈 계란말이', 1),
  (2, '감자전', 6000, '바삭한 감자전', 2),
  (3, '콜라', 2000, '코카콜라 355ml', 1),
  (3, '사이다', 2000, '칠성사이다 355ml', 2);

-- 테이블
INSERT INTO restaurant_table (store_id, table_number) VALUES
  (1, 1),
  (1, 2),
  (1, 3);
```
