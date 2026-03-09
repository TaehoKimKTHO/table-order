# Unit 4: 고객 주문 - 비즈니스 로직 모델

## 1. Unit 4 범위

Unit 4는 고객용 API Routes(얇은 레이어)를 구현합니다. 비즈니스 로직은 Unit 1(Auth, SSE), Unit 2(Order), Unit 3(Menu)의 모듈을 호출하며, API Route는 요청 파싱, 인증 검증, 모듈 호출, 응답 포맷팅만 담당합니다.

---

## 2. API Route 비즈니스 로직

### 2.1 POST /api/customer/auth/login — 테이블 로그인

```
요청: { storeCode: string, tableNumber: number }
  |
  v
[1] 요청 바디 파싱 및 검증
  |-- storeCode 필수, tableNumber 필수
  v
[2] Auth.loginTable(storeCode, tableNumber) 호출
  |-- 성공 → { sessionToken, tableId, tableNumber, storeName }
  |-- 실패 → AppError 전파
  v
[3] 응답 반환
  |-- 200: { sessionToken, tableId, tableNumber, storeName }
  |-- 4xx: { error: { code, message } }
```

### 2.2 GET /api/customer/auth/validate — 세션 검증

```
요청: Authorization 헤더 (Bearer {sessionToken})
  |
  v
[1] 헤더에서 sessionToken 추출
  |-- 없음 → 401 SESSION_NOT_FOUND
  v
[2] Auth.validateSession(sessionToken) 호출
  |-- 유효 → { tableId, sessionId, tableNumber, isValid: true }
  |-- 무효 → AppError 전파
  v
[3] 응답 반환
  |-- 200: { tableId, sessionId, tableNumber, isValid }
```

### 2.3 GET /api/customer/menu — 전체 메뉴 조회

```
요청: Authorization 헤더
  |
  v
[1] 세션 검증 (validateSession)
  |-- 실패 → 401
  v
[2] 세션에서 storeId 추출 (테이블 → 매장)
  v
[3] Menu.getAllMenuItems(storeId) 호출
  |-- 고객용이므로 is_available=1 메뉴만 필터링
  v
[4] 응답 반환
  |-- 200: { categories: [{ id, name, sortOrder, items: MenuItem[] }] }
```

### 2.4 GET /api/customer/menu/[categoryId] — 카테고리별 메뉴 조회

```
요청: Authorization 헤더, URL param: categoryId
  |
  v
[1] 세션 검증
  v
[2] Menu.getMenuItems(categoryId) 호출
  |-- 판매 가능 메뉴만 반환 (is_available=1)
  v
[3] 응답 반환
  |-- 200: { items: MenuItem[] }
```

### 2.5 POST /api/customer/orders — 주문 생성

```
요청: Authorization 헤더, Body: { items: [{ menuItemId, quantity }] }
  |
  v
[1] 세션 검증 → tableId, sessionId 추출
  v
[2] 요청 바디 검증
  |-- items 배열 필수, 최소 1개
  |-- 각 item: menuItemId(필수), quantity(1~99)
  v
[3] Order.createOrder(tableId, sessionId, items) 호출
  |-- 내부에서 메뉴 존재/판매 가능 검증
  |-- 주문번호 자동 생성 (ORD-YYYYMMDD-XXXX)
  |-- total_amount 계산
  v
[4] SSE.notifyNewOrder(order) 호출
  |-- 관리자에게 신규 주문 알림
  v
[5] 응답 반환
  |-- 201: { orderId, orderNumber, totalAmount, createdAt }
  |-- 4xx: { error: { code, message } }
```

### 2.6 GET /api/customer/orders — 세션별 주문 목록 조회

```
요청: Authorization 헤더
  |
  v
[1] 세션 검증 → sessionId 추출
  v
[2] Order.getOrdersBySession(sessionId) 호출
  v
[3] 응답 반환
  |-- 200: { orders: Order[] }
  |-- 각 Order: { id, orderNumber, status, totalAmount, createdAt, items: OrderItem[] }
```

### 2.7 GET /api/customer/orders/[orderId] — 주문 상세 조회

```
요청: Authorization 헤더, URL param: orderId
  |
  v
[1] 세션 검증 → sessionId 추출
  v
[2] Order.getOrder(orderId) 호출
  v
[3] 주문의 sessionId와 요청자의 sessionId 일치 확인
  |-- 불일치 → 403 (다른 세션의 주문 접근 불가)
  v
[4] 응답 반환
  |-- 200: Order (with items)
```

### 2.8 GET /api/customer/sse — SSE 연결

```
요청: Authorization 헤더 또는 Query param: token
  |
  v
[1] 세션 검증 → tableId 추출
  v
[2] SSE 응답 헤더 설정
  |-- Content-Type: text/event-stream
  |-- Cache-Control: no-cache
  |-- Connection: keep-alive
  v
[3] SSE.addConnection(clientId, 'customer', tableId, response) 호출
  v
[4] 연결 유지 (서버 → 클라이언트 단방향)
  |-- 수신 이벤트: order:status, order:deleted, table:completed
  v
[5] 연결 종료 시 SSE.removeConnection(clientId)
```

---

## 3. 인증 미들웨어 패턴

모든 고객 API(login 제외)는 세션 검증이 필요합니다. 공통 패턴:

```
function withAuth(handler):
  [1] Authorization 헤더에서 Bearer 토큰 추출
  [2] Auth.validateSession(token) 호출
  [3] 유효 → handler에 { tableId, sessionId, tableNumber } 전달
  [4] 무효 → 401 응답
```

---

## 4. 에러 응답 패턴

모든 API Route는 동일한 에러 응답 형식을 사용합니다:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자 친화적 메시지"
  }
}
```

AppError 인스턴스는 statusCode를 포함하므로 HTTP 상태 코드로 직접 매핑됩니다.
