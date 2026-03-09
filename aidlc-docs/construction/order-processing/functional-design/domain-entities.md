# Unit 2: 주문 처리 - 도메인 엔티티 설계

## 1. 엔티티 개요

Unit 2는 주문 관련 비즈니스 로직을 담당합니다. Unit 1에서 정의한 7개 엔티티 중 **Order**, **OrderItem** 엔티티를 직접 관리하며, **TableSession**, **RestaurantTable**, **MenuItem** 엔티티를 참조(읽기 전용)합니다.

---

## 2. Unit 2 직접 관리 엔티티

### 2.1 Order (주문) — 핵심 엔티티

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

| 필드 | 타입 | 제약조건 | Unit 2 역할 |
|---|---|---|---|
| id | INTEGER | PK, AUTO INCREMENT | 주문 식별 |
| table_id | INTEGER | FK → restaurant_table(id) | 주문 소속 테이블 (읽기) |
| session_id | INTEGER | FK → table_session(id) | 주문 소속 세션 (읽기) |
| order_number | TEXT | NOT NULL, UNIQUE | 자동 생성 (ORD-YYYYMMDD-XXXX) |
| status | TEXT | CHECK(pending/preparing/completed) | 상태 전이 관리 |
| total_amount | INTEGER | NOT NULL | 주문 항목 소계 합산 |
| created_at | TEXT | DEFAULT now | 주문 생성 시각 |
| updated_at | TEXT | DEFAULT now | 상태 변경 시 갱신 |

**Unit 2 책임:**
- 주문 레코드 생성 (INSERT)
- 주문 상태 변경 (UPDATE status, updated_at)
- 주문 삭제 (DELETE — CASCADE로 order_item 함께 삭제)
- 주문 조회 (SELECT — 다양한 조건)

---

### 2.2 OrderItem (주문 항목) — 종속 엔티티

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

| 필드 | 타입 | 제약조건 | Unit 2 역할 |
|---|---|---|---|
| id | INTEGER | PK, AUTO INCREMENT | 항목 식별 |
| order_id | INTEGER | FK → order(id), CASCADE | 소속 주문 참조 |
| menu_item_id | INTEGER | FK → menu_item(id) | 원본 메뉴 참조 (이력 추적용) |
| menu_name | TEXT | NOT NULL | 주문 시점 메뉴명 스냅샷 |
| quantity | INTEGER | NOT NULL | 수량 (1~99) |
| unit_price | INTEGER | NOT NULL | 주문 시점 단가 스냅샷 |
| subtotal | INTEGER | NOT NULL | quantity × unit_price |

**Unit 2 책임:**
- 주문 생성 시 항목 일괄 삽입 (INSERT)
- 주문 조회 시 항목 함께 반환 (SELECT JOIN)
- 주문 삭제 시 CASCADE로 자동 삭제

---

## 3. Unit 2 참조 엔티티 (읽기 전용)

### 3.1 TableSession — 세션 유효성 확인용

| 참조 목적 | 사용 필드 | 조건 |
|---|---|---|
| 주문 생성 시 세션 활성 여부 확인 | id, status | status = 'active' |
| 세션별 주문 조회 | id | WHERE session_id = ? |

### 3.2 RestaurantTable — 테이블 정보 조회용

| 참조 목적 | 사용 필드 | 조건 |
|---|---|---|
| 테이블별 주문 조회 | id | WHERE table_id = ? |
| 주문 응답에 테이블 번호 포함 | id, table_number | JOIN |

### 3.3 MenuItem — 메뉴 정보 스냅샷용

| 참조 목적 | 사용 필드 | 조건 |
|---|---|---|
| 주문 생성 시 메뉴 존재/판매 가능 확인 | id, is_available | is_available = 1 |
| 주문 항목에 메뉴명/단가 스냅샷 저장 | name, price | 주문 시점 값 복사 |

---

## 4. Unit 2 엔티티 관계도

```
[Unit 1 관리]                    [Unit 2 관리]
                                
RestaurantTable ──1:N──→ Order ──1:N──→ OrderItem
       |                   |                |
TableSession ──1:N────────→|                |
                                            |
[Unit 3 관리]                               |
MenuItem ──────────────── N:1 ──────────────+
  (읽기 전용 참조)         (menu_item_id FK)
```

### 관계 상세

| 관계 | 타입 | Unit 2 관점 | 설명 |
|---|---|---|---|
| TableSession → Order | 1:N | 세션 ID로 주문 생성/조회 | 활성 세션에서만 주문 생성 |
| RestaurantTable → Order | 1:N | 테이블 ID로 주문 조회 | 테이블별 주문 그룹핑 |
| Order → OrderItem | 1:N | 주문 생성 시 항목 일괄 삽입 | CASCADE 삭제 |
| MenuItem → OrderItem | 1:N | 메뉴 정보 스냅샷 저장 | menu_name, unit_price 복사 |

---

## 5. 주문번호 생성 규칙

### 형식: `ORD-YYYYMMDD-XXXX`

| 구성 요소 | 설명 | 예시 |
|---|---|---|
| ORD | 고정 접두사 | ORD |
| YYYYMMDD | 주문 생성 날짜 | 20260309 |
| XXXX | 해당 날짜의 순번 (4자리, 0 패딩) | 0001, 0002, ... |

**생성 로직:**
1. 현재 날짜의 마지막 주문번호 조회: `SELECT order_number FROM "order" WHERE order_number LIKE 'ORD-YYYYMMDD-%' ORDER BY order_number DESC LIMIT 1`
2. 순번 추출 후 +1 (없으면 0001부터 시작)
3. 형식에 맞게 조합: `ORD-${date}-${seq.toString().padStart(4, '0')}`

---

## 6. 스냅샷 전략

주문 항목(OrderItem)은 주문 시점의 메뉴 정보를 스냅샷으로 저장합니다.

| 스냅샷 필드 | 원본 엔티티 | 원본 필드 | 이유 |
|---|---|---|---|
| menu_name | MenuItem | name | 메뉴명 변경 시 기존 주문 영향 방지 |
| unit_price | MenuItem | price | 가격 변경 시 기존 주문 영향 방지 |

**스냅샷 시점**: `createOrder()` 호출 시 MenuItem에서 현재 값을 읽어 OrderItem에 복사

---

## 7. 인덱스 활용

Unit 2가 활용하는 인덱스 (Unit 1에서 생성됨):

| 인덱스 | 활용 메서드 | 쿼리 패턴 |
|---|---|---|
| idx_order_table | getOrdersByTable(), getTableTotalAmount() | WHERE table_id = ? |
| idx_order_session | getOrdersBySession() | WHERE session_id = ? |
| idx_order_status | getAllActiveOrders() | WHERE status IN ('pending', 'preparing') |
| idx_order_item_order | getOrder(), 주문 항목 조회 | WHERE order_id = ? |
