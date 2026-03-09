# Integration Test Instructions

## 목적

유닛 간 상호작용이 올바르게 동작하는지 검증합니다. 특히 API Route → Business Logic → Database 레이어 간 통합을 테스트합니다.

## 선행 조건

- Unit 1 ~ Unit 4 코드 생성 완료
- `npm install` 완료
- SQLite DB 초기화 및 시드 데이터 적용

## 테스트 환경 설정

### 1. 테스트용 환경 변수

```bash
# .env.test
DATABASE_PATH=./data/test.db
NODE_ENV=test
```

### 2. 테스트 DB 초기화

```bash
# Unit 1 구현 후 사용 가능한 DB 초기화 스크립트
npx ts-node scripts/init-db.ts --env test
```

## 통합 테스트 시나리오

### 시나리오 1: 고객 로그인 → 메뉴 조회 플로우

**테스트 대상**: Unit 4 (API Route) → Unit 1 (Auth, DB)

| 단계 | 요청 | 기대 결과 |
|---|---|---|
| 1 | POST /api/customer/auth/login `{ storeCode: "STORE1", tableNumber: 1 }` | 200, sessionToken 반환 |
| 2 | GET /api/customer/auth/validate (Bearer token) | 200, isValid: true |
| 3 | GET /api/customer/menu (Bearer token) | 200, categories + menuItems 반환 |
| 4 | GET /api/customer/menu/1 (Bearer token) | 200, 해당 카테고리 메뉴 반환 |

**검증 포인트**:
- 로그인 시 TableSession 생성 확인
- sessionToken으로 인증 통과 확인
- 메뉴 데이터가 DB 시드 데이터와 일치

### 시나리오 2: 장바구니 → 주문 생성 플로우

**테스트 대상**: Unit 4 (API Route) → Unit 2 (Order) → Unit 1 (DB)

| 단계 | 요청 | 기대 결과 |
|---|---|---|
| 1 | POST /api/customer/auth/login | 200, sessionToken |
| 2 | POST /api/customer/orders `{ items: [{ menuItemId: 1, quantity: 2 }] }` | 201, orderId + orderNumber |
| 3 | GET /api/customer/orders | 200, 주문 목록에 새 주문 포함 |
| 4 | GET /api/customer/orders/{orderId} | 200, 주문 상세 (items 포함) |

**검증 포인트**:
- 주문 생성 시 Order + OrderItem 레코드 생성
- totalAmount = unitPrice × quantity 합계
- orderNumber 형식: `ORD-YYYYMMDD-NNN`
- 주문 상태 초기값: `pending`

### 시나리오 3: SSE 실시간 이벤트 수신

**테스트 대상**: Unit 4 (SSE Route) → Unit 1 (SSE Module)

| 단계 | 요청 | 기대 결과 |
|---|---|---|
| 1 | POST /api/customer/auth/login | 200, sessionToken |
| 2 | GET /api/customer/sse?token={token} | SSE 연결 수립, `connected` 이벤트 수신 |
| 3 | (관리자) 주문 상태 변경 | `order:status` 이벤트 수신 |
| 4 | (관리자) 이용 완료 처리 | `table:completed` 이벤트 수신 |

**검증 포인트**:
- SSE 연결 시 `connected` 이벤트 즉시 수신
- 주문 상태 변경 시 해당 테이블 클라이언트에만 이벤트 전달
- 이용 완료 시 해당 테이블 클라이언트에 `table:completed` 전달

### 시나리오 4: 인증 실패 케이스

**테스트 대상**: Unit 4 (API Route) → Unit 1 (Auth)

| 단계 | 요청 | 기대 결과 |
|---|---|---|
| 1 | POST /api/customer/auth/login `{ storeCode: "INVALID", tableNumber: 1 }` | 401, 에러 메시지 |
| 2 | GET /api/customer/menu (토큰 없음) | 401, UNAUTHORIZED |
| 3 | GET /api/customer/menu (만료/무효 토큰) | 401, INVALID_SESSION |
| 4 | POST /api/customer/orders (토큰 없음) | 401, UNAUTHORIZED |

**검증 포인트**:
- 잘못된 매장코드로 로그인 실패
- 인증 헤더 없이 API 호출 시 401 반환
- 무효 토큰으로 API 호출 시 401 반환

### 시나리오 5: Unit 3 (Menu) → Unit 1 (DB) 통합

**테스트 대상**: Unit 3 (Menu Module) → Unit 1 (Database)

| 단계 | 동작 | 기대 결과 |
|---|---|---|
| 1 | createCategory({ storeId: 1, name: "신메뉴" }) | 카테고리 생성, DB 저장 확인 |
| 2 | createMenuItem({ name: "테스트", price: 10000, categoryId: 위 ID }) | 메뉴 생성, DB 저장 확인 |
| 3 | getMenuItems(위 categoryId) | 생성한 메뉴 포함 확인 |
| 4 | deleteMenuItem(위 menuItemId) | 삭제 후 조회 불가 |
| 5 | deleteCategory(위 categoryId) | 카테고리 삭제 확인 |

**검증 포인트**:
- CRUD 작업이 SQLite에 정상 반영
- 외래 키 제약조건 동작 확인
- 트랜잭션 롤백 동작 확인

## 테스트 실행

```bash
# 통합 테스트 실행 (Unit 1, 2 구현 후)
npx vitest run src/**/__tests__/integration/**

# 또는 수동 테스트 (개발 서버 실행 후 curl/httpie 사용)
npm run dev
# 별도 터미널에서:
curl -X POST http://localhost:3000/api/customer/auth/login \
  -H "Content-Type: application/json" \
  -d '{"storeCode":"STORE1","tableNumber":1}'
```

## 정리

```bash
# 테스트 DB 삭제
rm -f data/test.db
```
