# Unit 4: 고객 주문 - Code Generation Plan

## Unit Context
- **Unit Name**: 고객 주문 (Customer Order)
- **파일 범위**: `table-order/src/app/api/customer/`, `table-order/src/app/customer/`, `table-order/src/components/customer/`
- **의존성**: Unit 1 (Auth, SSE), Unit 2 (Order), Unit 3 (Menu)
- **관련 스토리**: US-C02, US-C03, US-C04, US-C05

## Code Generation Steps

### Step 1: 공통 유틸 및 타입
- [x] `table-order/src/types/order.ts` — Order, OrderItem 타입 정의
- [x] `table-order/src/lib/api-utils.ts` — API Route 공통 유틸 (인증 미들웨어, 에러 핸들러)

### Step 2: 고객 API Routes — 인증
- [x] `table-order/src/app/api/customer/auth/login/route.ts` — POST 테이블 로그인
- [x] `table-order/src/app/api/customer/auth/validate/route.ts` — GET 세션 검증

### Step 3: 고객 API Routes — 메뉴
- [x] `table-order/src/app/api/customer/menu/route.ts` — GET 전체 메뉴 조회
- [x] `table-order/src/app/api/customer/menu/[categoryId]/route.ts` — GET 카테고리별 메뉴

### Step 4: 고객 API Routes — 주문
- [x] `table-order/src/app/api/customer/orders/route.ts` — POST 주문 생성, GET 주문 목록
- [x] `table-order/src/app/api/customer/orders/[orderId]/route.ts` — GET 주문 상세

### Step 5: 고객 API Routes — SSE
- [x] `table-order/src/app/api/customer/sse/route.ts` — GET SSE 연결

### Step 6: 커스텀 훅
- [x] `table-order/src/hooks/useSession.ts` — 세션 관리 훅
- [x] `table-order/src/hooks/useCart.ts` — 장바구니 관리 훅
- [x] `table-order/src/hooks/useSSE.ts` — SSE 연결 훅

### Step 7: 공통 컴포넌트
- [x] `table-order/src/components/customer/CustomerHeader.tsx`
- [x] `table-order/src/components/customer/CustomerNav.tsx`

### Step 8: 메뉴 컴포넌트
- [x] `table-order/src/components/customer/CategoryBar.tsx`
- [x] `table-order/src/components/customer/MenuCard.tsx`
- [x] `table-order/src/components/customer/MenuGrid.tsx`

### Step 9: 장바구니 컴포넌트
- [x] `table-order/src/components/customer/CartItem.tsx`
- [x] `table-order/src/components/customer/CartSummary.tsx`
- [x] `table-order/src/components/customer/OrderConfirmModal.tsx`
- [x] `table-order/src/components/customer/OrderSuccessModal.tsx`

### Step 10: 주문 내역 컴포넌트
- [x] `table-order/src/components/customer/OrderCard.tsx`
- [x] `table-order/src/components/customer/LoginForm.tsx`

### Step 11: 페이지 조립
- [x] `table-order/src/app/customer/layout.tsx` — 고객 레이아웃
- [x] `table-order/src/app/customer/page.tsx` — 메뉴 페이지
- [x] `table-order/src/app/customer/cart/page.tsx` — 장바구니 페이지
- [x] `table-order/src/app/customer/orders/page.tsx` — 주문 내역 페이지
- [x] `table-order/src/app/customer/login/page.tsx` — 로그인 페이지

### Step 12: Documentation
- [x] `aidlc-docs/construction/customer-order/code/code-summary.md`
