# 테이블오더 서비스 - Unit of Work 정의

## 분해 전략

사용자 기준 3개 유닛(고객 주문, 관리자 대시보드, 공통 API)을 기반으로 하되, **모듈 중첩이 발생하는 Menu Module과 Order Module을 별도 유닛으로 분리**하여 각 유닛이 독립적으로 개발 가능하도록 5개 유닛으로 분해합니다.

### 중첩 분석 및 분리 근거

| 모듈 | 고객 주문에서 사용 | 관리자 대시보드에서 사용 | 중첩 여부 |
|---|---|---|---|
| Database | - | - | 없음 (공통 API) |
| Auth | - | - | 없음 (공통 API) |
| SSE | 상태 수신 | 주문 수신/발신 | 없음 (공통 API — 인프라 성격) |
| Menu | 조회 (getCategories, getMenuItems, getAllMenuItems, getMenuItem) | CRUD (create/update/deleteMenuItem, updateMenuOrder, create/update/deleteCategory) | ⚠️ 중첩 → **메뉴 관리 유닛 분리** |
| Order | 생성/조회 (createOrder, getOrder, getOrdersBySession) | 관리 (getAllActiveOrders, updateOrderStatus, deleteOrder, getOrdersByTable, getTableTotalAmount) | ⚠️ 중첩 → **주문 처리 유닛 분리** |
| Table | - | 전체 사용 | 없음 (관리자 대시보드) |
| Upload | - | 이미지 업로드 | 없음 (메뉴 관리와 함께 분리) |

---

## Unit 1: 공통 API 유닛 (Common API)

**목적**: 인증, 데이터 접근, 실시간 통신 등 전체 시스템의 공통 인프라 구축

**포함 모듈**: Database Module, Auth Module, SSE Module

**범위**:
- `src/lib/db/` — SQLite 스키마, 마이그레이션, 시드 데이터
- `src/lib/auth/` — 테이블 로그인, 세션 토큰 발급/검증
- `src/lib/sse/` — SSE 연결 관리, 이벤트 브로드캐스트
- `src/types/` — TypeScript 공통 타입 정의
- 프로젝트 초기화 (Next.js, Docker Compose, 디렉토리 구조)

**산출물**:
- Next.js 프로젝트 초기화 (TypeScript, App Router)
- SQLite 데이터베이스 스키마 (7개 엔티티)
- 시드 데이터 (매장, 카테고리, 메뉴, 테이블)
- Auth Module: loginTable(), validateSession(), getActiveSession()
- SSE Module: addConnection(), removeConnection(), broadcastToAdmin(), broadcastToTable(), notifyNewOrder(), notifyOrderStatusChange(), notifyOrderDeleted()
- Database Module: getDb(), initializeDb(), seedData()
- TypeScript 공통 타입/인터페이스 정의
- Docker Compose 설정

**의존성**: 없음 (최초 유닛)

---

## Unit 2: 주문 처리 유닛 (Order Processing)

**목적**: 주문 생성, 상태 관리, 조회, 삭제 등 주문 관련 전체 비즈니스 로직

**포함 모듈**: Order Module

**범위**:
- `src/lib/order/` — 주문 비즈니스 로직 전체

**산출물**:
- createOrder() — 주문 생성 (주문번호 자동 생성)
- getOrder() — 주문 상세 조회
- getOrdersBySession() — 세션별 주문 목록 조회
- getOrdersByTable() — 테이블별 주문 조회
- getAllActiveOrders() — 매장 전체 활성 주문 조회
- updateOrderStatus() — 주문 상태 변경 (pending → preparing → completed)
- deleteOrder() — 주문 삭제
- getTableTotalAmount() — 테이블 세션 총 주문액 계산

**의존성**: Unit 1 (Database Module)

---

## Unit 3: 메뉴 관리 유닛 (Menu Management)

**목적**: 메뉴 및 카테고리 조회/CRUD, 이미지 업로드 등 메뉴 관련 전체 비즈니스 로직

**포함 모듈**: Menu Module, Upload Module

**범위**:
- `src/lib/menu/` — 메뉴/카테고리 비즈니스 로직 전체
- `src/lib/upload/` — 이미지 파일 업로드/삭제/서빙

**산출물**:
- getCategories(), getMenuItems(), getAllMenuItems(), getMenuItem() — 메뉴 조회
- createMenuItem(), updateMenuItem(), deleteMenuItem() — 메뉴 CRUD
- updateMenuOrder() — 메뉴 순서 변경
- createCategory(), updateCategory(), deleteCategory() — 카테고리 CRUD
- uploadImage(), deleteImage(), getImagePath() — 이미지 관리

**의존성**: Unit 1 (Database Module)

---

## Unit 4: 고객 주문 유닛 (Customer Order)

**목적**: 고객이 테이블에서 메뉴 조회, 장바구니 관리, 주문 생성, 주문 내역 확인을 수행하는 API Route 및 UI 구현

**포함 범위**:
- `src/app/api/customer/` — 고객용 API Routes
- `src/app/customer/` — 고객용 UI 페이지
- `src/components/customer/` — 고객 전용 React 컴포넌트

**산출물**:
- 고객용 API Routes 8개:
  - POST /api/customer/auth/login → Auth.loginTable()
  - GET /api/customer/auth/validate → Auth.validateSession()
  - GET /api/customer/menu → Menu.getAllMenuItems()
  - GET /api/customer/menu/[categoryId] → Menu.getMenuItems()
  - POST /api/customer/orders → Order.createOrder() + SSE.notifyNewOrder()
  - GET /api/customer/orders → Order.getOrdersBySession()
  - GET /api/customer/orders/[orderId] → Order.getOrder()
  - GET /api/customer/sse → SSE.addConnection()
- 고객용 UI 페이지:
  - 메뉴 조회/탐색 페이지 (카테고리별 탐색, 카드 레이아웃)
  - 장바구니 UI (로컬 저장, 수량 조절, 금액 계산)
  - 주문 생성/확인 페이지 (주문 확정, 주문번호 표시)
  - 주문 내역 페이지 (SSE 기반 실시간 상태 업데이트)

**의존성**: Unit 1 (Auth, SSE), Unit 2 (Order), Unit 3 (Menu)

---

## Unit 5: 관리자 대시보드 유닛 (Admin Dashboard)

**목적**: 관리자가 실시간 주문 모니터링, 테이블 관리를 수행하는 API Route 및 UI 구현

**포함 모듈**: Table Module

**포함 범위**:
- `src/lib/table/` — 테이블/세션 관리 비즈니스 로직
- `src/app/api/admin/` — 관리자용 API Routes
- `src/app/admin/` — 관리자용 UI 페이지
- `src/components/admin/` — 관리자 전용 React 컴포넌트

**산출물**:
- Table Module 구현:
  - createTable(), updateTable(), getTables(), getTable()
  - startSession(), endSession(), completeTable(), getOrderHistory()
- 관리자용 API Routes 17개:
  - GET /api/admin/orders → Order.getAllActiveOrders()
  - PATCH /api/admin/orders/[id]/status → Order.updateOrderStatus() + SSE.notifyOrderStatusChange()
  - DELETE /api/admin/orders/[id] → Order.deleteOrder() + SSE.notifyOrderDeleted()
  - GET /api/admin/tables → Table.getTables()
  - POST /api/admin/tables → Table.createTable()
  - PUT /api/admin/tables/[id] → Table.updateTable()
  - POST /api/admin/tables/[id]/complete → Table.completeTable() + SSE.broadcastToTable/Admin()
  - GET /api/admin/tables/[id]/history → Table.getOrderHistory()
  - GET/POST/PUT/DELETE /api/admin/menu/categories → Menu CRUD
  - GET/POST/PUT/DELETE /api/admin/menu/items → Menu CRUD + Upload
  - PATCH /api/admin/menu/items/[id]/order → Menu.updateMenuOrder()
  - GET /api/admin/sse → SSE.addConnection()
- 관리자용 UI 페이지:
  - 실시간 주문 대시보드 (그리드 레이아웃, SSE 기반, 신규 주문 강조)
  - 주문 상태 변경/삭제 UI
  - 테이블 관리 페이지 (등록, 수정, 이용 완료)
  - 과거 주문 내역 조회 페이지
  - 메뉴 관리 페이지 (카테고리/메뉴 CRUD, 이미지 업로드)
  - 테이블별 필터링

**의존성**: Unit 1 (SSE), Unit 2 (Order), Unit 3 (Menu, Upload)

---

## 코드 조직 전략

```
src/
+-- lib/                            # 백엔드 모듈
|   +-- db/                         # Unit 1 — Database
|   +-- auth/                       # Unit 1 — Auth
|   +-- sse/                        # Unit 1 — SSE
|   +-- order/                      # Unit 2 — Order (독립 유닛)
|   +-- menu/                       # Unit 3 — Menu (독립 유닛)
|   +-- upload/                     # Unit 3 — Upload
|   +-- table/                      # Unit 5 — Table
+-- types/                          # Unit 1 — 공통 타입
+-- app/
|   +-- api/
|   |   +-- customer/               # Unit 4 — 고객 API Routes
|   |   +-- admin/                  # Unit 5 — 관리자 API Routes
|   +-- customer/                   # Unit 4 — 고객 UI
|   +-- admin/                      # Unit 5 — 관리자 UI
+-- components/
|   +-- common/                     # Unit 1 — 공통 컴포넌트
|   +-- customer/                   # Unit 4 — 고객 컴포넌트
|   +-- admin/                      # Unit 5 — 관리자 컴포넌트
```

### 유닛 간 겹침 검증: ✅ 없음
- Unit 1 (공통 API): `src/lib/db/`, `src/lib/auth/`, `src/lib/sse/`, `src/types/`
- Unit 2 (주문 처리): `src/lib/order/`
- Unit 3 (메뉴 관리): `src/lib/menu/`, `src/lib/upload/`
- Unit 4 (고객 주문): `src/app/api/customer/`, `src/app/customer/`, `src/components/customer/`
- Unit 5 (관리자 대시보드): `src/lib/table/`, `src/app/api/admin/`, `src/app/admin/`, `src/components/admin/`
- **모든 유닛의 파일 범위가 완전히 분리됨**
