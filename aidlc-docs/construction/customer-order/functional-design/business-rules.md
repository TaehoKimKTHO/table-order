# Unit 4: 고객 주문 - 비즈니스 규칙 정의

## 1. Unit 4 규칙 범위

Unit 4는 API Route 레이어의 요청 검증과 접근 제어 규칙을 정의합니다. 핵심 비즈니스 규칙은 Unit 1~3 모듈에서 이미 정의되어 있으며, Unit 4는 이를 호출하는 얇은 레이어입니다.

---

## 2. API 요청 검증 규칙

### RV-01: 인증 요청 검증

| 규칙 ID | 엔드포인트 | 규칙 | 에러 |
|---|---|---|---|
| RV-01-01 | POST /auth/login | storeCode 필수, 문자열 | 400 Bad Request |
| RV-01-02 | POST /auth/login | tableNumber 필수, 양의 정수 | 400 Bad Request |

### RV-02: 주문 요청 검증

| 규칙 ID | 엔드포인트 | 규칙 | 에러 |
|---|---|---|---|
| RV-02-01 | POST /orders | items 배열 필수, 최소 1개 | EMPTY_ORDER |
| RV-02-02 | POST /orders | items[].menuItemId 필수, 양의 정수 | 400 Bad Request |
| RV-02-03 | POST /orders | items[].quantity 필수, 1~99 정수 | INVALID_QUANTITY |

### RV-03: URL 파라미터 검증

| 규칙 ID | 엔드포인트 | 규칙 | 에러 |
|---|---|---|---|
| RV-03-01 | GET /menu/[categoryId] | categoryId 양의 정수 | 400 Bad Request |
| RV-03-02 | GET /orders/[orderId] | orderId 양의 정수 | 400 Bad Request |

---

## 3. 접근 제어 규칙

### AC-01: 세션 기반 인증

| 규칙 ID | 규칙 | 적용 범위 |
|---|---|---|
| AC-01-01 | 모든 API(login 제외)는 유효한 세션 토큰 필요 | Authorization: Bearer {token} |
| AC-01-02 | 세션 토큰은 활성 세션(status='active')이어야 함 | validateSession 검증 |
| AC-01-03 | 주문 조회는 자신의 세션 주문만 접근 가능 | sessionId 일치 확인 |

### AC-02: SSE 연결 인증

| 규칙 ID | 규칙 | 설명 |
|---|---|---|
| AC-02-01 | SSE 연결 시 세션 토큰 필요 | 헤더 또는 Query param으로 전달 |
| AC-02-02 | 자신의 테이블 이벤트만 수신 | tableId 기반 필터링 |

---

## 4. 응답 규칙

### RS-01: 성공 응답

| 규칙 ID | 엔드포인트 | HTTP 상태 | 응답 형식 |
|---|---|---|---|
| RS-01-01 | POST /auth/login | 200 | { sessionToken, tableId, tableNumber, storeName } |
| RS-01-02 | GET /auth/validate | 200 | { tableId, sessionId, tableNumber, isValid } |
| RS-01-03 | GET /menu | 200 | { categories: CategoryWithItems[] } |
| RS-01-04 | GET /menu/[categoryId] | 200 | { items: MenuItem[] } |
| RS-01-05 | POST /orders | 201 | { orderId, orderNumber, totalAmount, createdAt } |
| RS-01-06 | GET /orders | 200 | { orders: Order[] } |
| RS-01-07 | GET /orders/[orderId] | 200 | Order (with items) |

### RS-02: 에러 응답

| 규칙 ID | 규칙 | 설명 |
|---|---|---|
| RS-02-01 | 모든 에러는 { error: { code, message } } 형식 | AppError.toJSON() 활용 |
| RS-02-02 | HTTP 상태 코드는 AppError.statusCode 사용 | 에러 코드별 매핑 |
| RS-02-03 | 예상치 못한 에러는 500 + INTERNAL_ERROR | try-catch로 감싸기 |

---

## 5. 장바구니 규칙 (클라이언트 사이드)

장바구니는 서버에 저장하지 않고 클라이언트 localStorage에서 관리합니다.

| 규칙 ID | 규칙 | 설명 |
|---|---|---|
| CR-01-01 | 장바구니는 localStorage에 저장 | 키: `cart_{tableId}` |
| CR-01-02 | 페이지 새로고침 시 장바구니 유지 | localStorage 기반 |
| CR-01-03 | 주문 성공 시 장바구니 자동 비우기 | 주문 API 성공 응답 후 |
| CR-01-04 | 세션 종료(table:completed) 시 장바구니 비우기 | SSE 이벤트 수신 시 |
| CR-01-05 | 수량 범위: 1~99 | 클라이언트 검증 |
| CR-01-06 | 총 금액 실시간 계산 | 수량 변경 시 즉시 반영 |
