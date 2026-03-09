# Unit 4: 고객 주문 - Functional Design Plan

## Unit Context
- **Unit Name**: 고객 주문 (Customer Order)
- **파일 범위**: `table-order/src/app/api/customer/`, `table-order/src/app/customer/`, `table-order/src/components/customer/`
- **의존성**: Unit 1 (Auth, SSE), Unit 2 (Order), Unit 3 (Menu)
- **관련 스토리**: US-C02(메뉴 조회), US-C03(장바구니), US-C04(주문 생성), US-C05(주문 내역)

## 선행 조건
- [x] Unit 1 Functional Design 완료
- [x] Unit 3 Functional Design 완료
- [x] Application Design 완료 (API 엔드포인트, 컴포넌트 메서드 정의)

## Functional Design Steps

### API Routes
- [x] Step 1: 인증 API 설계 (POST /api/customer/auth/login, GET /api/customer/auth/validate)
- [x] Step 2: 메뉴 조회 API 설계 (GET /api/customer/menu, GET /api/customer/menu/[categoryId])
- [x] Step 3: 주문 API 설계 (POST /api/customer/orders, GET /api/customer/orders, GET /api/customer/orders/[orderId])
- [x] Step 4: SSE 연결 API 설계 (GET /api/customer/sse)

### Frontend Components
- [x] Step 5: 페이지 구조 및 라우팅 설계
- [x] Step 6: 메뉴 조회/탐색 컴포넌트 설계
- [x] Step 7: 장바구니 컴포넌트 설계 (로컬 저장, 상태 관리)
- [x] Step 8: 주문 생성/확인 컴포넌트 설계
- [x] Step 9: 주문 내역 컴포넌트 설계 (SSE 실시간 업데이트)

### 산출물 생성
- [x] Step 10: business-logic-model.md 생성 (API Route 로직)
- [x] Step 11: business-rules.md 생성 (API 검증 규칙)
- [x] Step 12: frontend-components.md 생성 (컴포넌트 계층, Props, 상태)

## 참조 문서
- `aidlc-docs/inception/application-design/services.md` (Customer API 엔드포인트)
- `aidlc-docs/inception/application-design/component-methods.md` (모듈 메서드)
- `aidlc-docs/inception/user-stories/stories.md` (US-C02~C05)
- `mock-preview/index.html` (UI 디자인 참조)
