# Unit 2: 주문 처리 - 비즈니스 로직 모델

## 1. Unit 2 모듈 범위

Unit 2는 Order Module을 포함하며, 주문 생성/조회/상태 변경/삭제/금액 계산 등 주문 관련 전체 비즈니스 로직을 담당합니다.

**의존성**: Unit 1의 Database Module (getDb)
**참조 엔티티**: TableSession (활성 확인), MenuItem (스냅샷), RestaurantTable (테이블 정보)

---

## 2. Order Module 비즈니스 로직

### 2.1 주문 생성 플로우 (createOrder)

```
입력: tableId, sessionId, items[{ menuItemId, quantity }]
  |
  v
[1] 세션 유효성 확인
  |-- session_id로 table_session 조회
  |-- 세션 없음 → Error: SESSION_NOT_FOUND
  |-- status='completed' → Error: SESSION_NOT_ACTIVE
  |-- session.table_id ≠ tableId → Error: SESSION_NOT_ACTIVE
  v
[2] 주문 항목 검증
  |-- items 배열이 비어있음 → Error: EMPTY_ORDER
  |-- 각 item에 대해:
  |   |-- menu_item 조회 (menuItemId)
  |   |-- 메뉴 없음 → Error: MENU_NOT_FOUND
  |   |-- is_available = 0 → Error: MENU_NOT_AVAILABLE
  |   |-- quantity < 1 또는 > 99 → Error: INVALID_QUANTITY
  |   |-- 메뉴 정보 스냅샷 수집 (name, price)
  v
[3] 금액 계산
  |-- 각 항목: subtotal = quantity × unit_price
  |-- total_amount = SUM(subtotal)
  v
[4] 주문번호 생성
  |-- 오늘 날짜의 마지막 주문번호 조회
  |-- 순번 +1 (없으면 0001)
  |-- 형식: ORD-YYYYMMDD-XXXX
  v
[5] 트랜잭션으로 데이터 삽입
  |-- BEGIN TRANSACTION
  |-- "order" 테이블에 주문 레코드 삽입
  |-- order_item 테이블에 항목 레코드 일괄 삽입
  |-- COMMIT
  v
[6] 생성된 주문 반환
  |-- Order (with items, orderNumber)
```

**데이터 흐름:**
- 입력: `{ tableId: number, sessionId: number, items: { menuItemId: number, quantity: number }[] }`
- 출력: `OrderWithItems` (Order + OrderItem[])
- DB 조회: table_session, menu_item (각 항목별)
- DB 쓰기: order INSERT, order_item INSERT (N건)

---

### 2.2 주문 상세 조회 플로우 (getOrder)

```
입력: orderId
  |
  v
[1] 주문 조회
  |-- "order" 테이블에서 orderId로 조회
  |-- 주문 없음 → Error: ORDER_NOT_FOUND
  v
[2] 주문 항목 조회
  |-- order_item 테이블에서 order_id로 조회
  v
[3] 응답 반환
  |-- OrderWithItems (Order + items[])
```

**데이터 흐름:**
- 입력: `{ orderId: number }`
- 출력: `OrderWithItems`
- DB 조회: order, order_item (JOIN 또는 별도 쿼리)

---

### 2.3 세션별 주문 목록 조회 플로우 (getOrdersBySession)

```
입력: sessionId
  |
  v
[1] 세션의 주문 목록 조회
  |-- "order" 테이블에서 session_id로 조회
  |-- ORDER BY created_at DESC (최신순)
  v
[2] 각 주문의 항목 조회
  |-- order_item 테이블에서 order_id IN (...)으로 일괄 조회
  v
[3] 응답 반환
  |-- OrderWithItems[] (주문 목록 + 각 주문의 항목)
```

**데이터 흐름:**
- 입력: `{ sessionId: number }`
- 출력: `OrderWithItems[]`
- DB 조회: order (WHERE session_id), order_item (WHERE order_id IN)

---

### 2.4 테이블별 주문 조회 플로우 (getOrdersByTable)

```
입력: tableId, activeOnly (boolean)
  |
  v
[1] 조건 분기
  |-- activeOnly = true → status IN ('pending', 'preparing')
  |-- activeOnly = false → 전체 주문
  v
[2] 주문 목록 조회
  |-- "order" 테이블에서 table_id + 상태 조건으로 조회
  |-- ORDER BY created_at DESC
  v
[3] 각 주문의 항목 조회
  v
[4] 응답 반환
  |-- OrderWithItems[]
```

**데이터 흐름:**
- 입력: `{ tableId: number, activeOnly: boolean }`
- 출력: `OrderWithItems[]`

---

### 2.5 매장 전체 활성 주문 조회 플로우 (getAllActiveOrders)

```
입력: storeId
  |
  v
[1] 활성 주문 조회
  |-- "order" JOIN restaurant_table
  |-- WHERE restaurant_table.store_id = storeId
  |-- AND order.status IN ('pending', 'preparing')
  |-- ORDER BY order.created_at ASC (오래된 주문 우선)
  v
[2] 각 주문의 항목 조회
  v
[3] 테이블 정보 포함하여 반환
  |-- OrderWithItems[] (+ table_number)
```

**데이터 흐름:**
- 입력: `{ storeId: number }`
- 출력: `(OrderWithItems & { table_number: number })[]`
- DB 조회: order JOIN restaurant_table, order_item

---

### 2.6 주문 상태 변경 플로우 (updateOrderStatus)

```
입력: orderId, newStatus ('preparing' | 'completed')
  |
  v
[1] 주문 조회
  |-- orderId로 "order" 조회
  |-- 주문 없음 → Error: ORDER_NOT_FOUND
  v
[2] 상태 전이 검증
  |-- 현재 상태 확인
  |-- completed → * : Error: ORDER_ALREADY_COMPLETED
  |-- pending → completed : Error: INVALID_STATUS_TRANSITION (건너뛰기 금지)
  |-- preparing → pending : Error: INVALID_STATUS_TRANSITION (역방향 금지)
  |-- 허용 전이만 통과:
  |   pending → preparing ✅
  |   preparing → completed ✅
  v
[3] 상태 업데이트
  |-- UPDATE "order" SET status = ?, updated_at = datetime('now') WHERE id = ?
  v
[4] 변경된 주문 반환
  |-- Order (updated)
```

**데이터 흐름:**
- 입력: `{ orderId: number, status: 'preparing' | 'completed' }`
- 출력: `Order`
- DB 조회: order (SELECT)
- DB 쓰기: order (UPDATE status, updated_at)

**상태 전이 매트릭스:**

| 현재 \ 요청 | preparing | completed |
|---|---|---|
| pending | ✅ 허용 | ❌ INVALID_STATUS_TRANSITION |
| preparing | ❌ (동일 상태) | ✅ 허용 |
| completed | ❌ ORDER_ALREADY_COMPLETED | ❌ ORDER_ALREADY_COMPLETED |

---

### 2.7 주문 삭제 플로우 (deleteOrder)

```
입력: orderId
  |
  v
[1] 주문 조회
  |-- orderId로 "order" 조회
  |-- 주문 없음 → Error: ORDER_NOT_FOUND
  v
[2] 주문 정보 보존 (삭제 전)
  |-- tableId 저장 (SSE 알림용으로 호출자에게 반환)
  v
[3] 주문 삭제
  |-- DELETE FROM "order" WHERE id = ?
  |-- order_item은 CASCADE로 자동 삭제
  v
[4] 삭제된 주문 정보 반환
  |-- { orderId, tableId }
```

**데이터 흐름:**
- 입력: `{ orderId: number }`
- 출력: `{ orderId: number, tableId: number }`
- DB 조회: order (SELECT)
- DB 쓰기: order (DELETE — CASCADE)

---

### 2.8 테이블 세션 총 주문액 계산 플로우 (getTableTotalAmount)

```
입력: tableId, sessionId
  |
  v
[1] 세션의 전체 주문 금액 합산
  |-- SELECT SUM(total_amount) FROM "order"
  |-- WHERE table_id = ? AND session_id = ?
  v
[2] 응답 반환
  |-- number (총 금액, 주문 없으면 0)
```

**데이터 흐름:**
- 입력: `{ tableId: number, sessionId: number }`
- 출력: `number`
- DB 조회: order (SUM 집계)

---

## 3. 엔티티 간 상호작용 명세

### 3.1 주문 생성 시 상호작용

```
Order Module
  |
  |-- [읽기] table_session → 세션 활성 여부 확인
  |-- [읽기] menu_item → 메뉴 존재/판매 가능 확인 + 스냅샷 데이터 수집
  |-- [쓰기] order → 주문 레코드 생성
  |-- [쓰기] order_item → 주문 항목 레코드 생성 (N건)
```

### 3.2 주문 상태 변경 시 상호작용

```
Order Module
  |
  |-- [읽기] order → 현재 상태 확인
  |-- [쓰기] order → status, updated_at 갱신
```

### 3.3 주문 삭제 시 상호작용

```
Order Module
  |
  |-- [읽기] order → 주문 존재 확인 + tableId 보존
  |-- [삭제] order → 주문 삭제 (order_item CASCADE 삭제)
```

### 3.4 외부 모듈과의 상호작용 (API Layer에서 오케스트레이션)

```
[API Route Layer]
  |
  |-- createOrder() 호출 후 → SSE.notifyNewOrder(order)
  |-- updateOrderStatus() 호출 후 → SSE.notifyOrderStatusChange(order)
  |-- deleteOrder() 호출 후 → SSE.notifyOrderDeleted(orderId, tableId)
```

**참고**: Order Module 자체는 SSE Module에 의존하지 않습니다. SSE 알림은 API Route 레이어에서 오케스트레이션합니다 (레이어 분리 원칙).

---

## 4. 트랜잭션 경계

| 메서드 | 트랜잭션 필요 | 이유 |
|---|---|---|
| createOrder | ✅ 필수 | order + order_item 다중 INSERT 원자성 보장 |
| updateOrderStatus | ❌ 불필요 | 단일 UPDATE |
| deleteOrder | ❌ 불필요 | CASCADE로 원자성 보장 |
| getOrder | ❌ 불필요 | 읽기 전용 |
| getOrdersBySession | ❌ 불필요 | 읽기 전용 |
| getOrdersByTable | ❌ 불필요 | 읽기 전용 |
| getAllActiveOrders | ❌ 불필요 | 읽기 전용 |
| getTableTotalAmount | ❌ 불필요 | 읽기 전용 |

---

## 5. 에러 처리 전략

Order Module의 모든 에러는 다음 형식으로 throw합니다:

```typescript
throw { code: string, message: string, status: number }
```

| 메서드 | 발생 가능 에러 | HTTP 상태 |
|---|---|---|
| createOrder | SESSION_NOT_FOUND, SESSION_NOT_ACTIVE, EMPTY_ORDER, MENU_NOT_FOUND, MENU_NOT_AVAILABLE, INVALID_QUANTITY | 400/401/404 |
| getOrder | ORDER_NOT_FOUND | 404 |
| updateOrderStatus | ORDER_NOT_FOUND, ORDER_ALREADY_COMPLETED, INVALID_STATUS_TRANSITION | 400/404 |
| deleteOrder | ORDER_NOT_FOUND | 404 |
| getOrdersBySession | (에러 없음 — 빈 배열 반환) | - |
| getOrdersByTable | (에러 없음 — 빈 배열 반환) | - |
| getAllActiveOrders | (에러 없음 — 빈 배열 반환) | - |
| getTableTotalAmount | (에러 없음 — 0 반환) | - |
