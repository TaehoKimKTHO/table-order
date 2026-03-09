# 테이블오더 서비스 - 서비스 정의

## 서비스 아키텍처 개요

Next.js App Router의 API Routes를 통해 RESTful API를 제공하며, SSE를 통한 실시간 통신을 지원합니다.

---

## 1. Customer API Service (고객용 API)

**Base Path**: `/api/customer`

| 엔드포인트 | 메서드 | 설명 | 사용 모듈 |
|---|---|---|---|
| `/api/customer/auth/login` | POST | 테이블 로그인 | Auth |
| `/api/customer/auth/validate` | GET | 세션 유효성 검증 | Auth |
| `/api/customer/menu` | GET | 전체 메뉴 조회 (카테고리 포함) | Menu |
| `/api/customer/menu/[categoryId]` | GET | 카테고리별 메뉴 조회 | Menu |
| `/api/customer/orders` | POST | 주문 생성 | Order, SSE |
| `/api/customer/orders` | GET | 현재 세션 주문 목록 조회 | Order |
| `/api/customer/orders/[orderId]` | GET | 주문 상세 조회 | Order |
| `/api/customer/sse` | GET | SSE 연결 (주문 상태 업데이트) | SSE |

---

## 2. Admin API Service (관리자용 API)

**Base Path**: `/api/admin`

| 엔드포인트 | 메서드 | 설명 | 사용 모듈 |
|---|---|---|---|
| `/api/admin/orders` | GET | 전체 활성 주문 조회 | Order |
| `/api/admin/orders/[orderId]/status` | PATCH | 주문 상태 변경 | Order, SSE |
| `/api/admin/orders/[orderId]` | DELETE | 주문 삭제 | Order, SSE |
| `/api/admin/tables` | GET | 테이블 목록 조회 | Table |
| `/api/admin/tables` | POST | 테이블 등록 | Table |
| `/api/admin/tables/[tableId]` | PUT | 테이블 정보 수정 | Table |
| `/api/admin/tables/[tableId]/complete` | POST | 매장 이용 완료 | Table, Order, SSE |
| `/api/admin/tables/[tableId]/history` | GET | 과거 주문 내역 조회 | Table |
| `/api/admin/menu/categories` | GET | 카테고리 목록 조회 | Menu |
| `/api/admin/menu/categories` | POST | 카테고리 등록 | Menu |
| `/api/admin/menu/categories/[id]` | PUT | 카테고리 수정 | Menu |
| `/api/admin/menu/categories/[id]` | DELETE | 카테고리 삭제 | Menu |
| `/api/admin/menu/items` | GET | 메뉴 목록 조회 | Menu |
| `/api/admin/menu/items` | POST | 메뉴 등록 (이미지 포함) | Menu, Upload |
| `/api/admin/menu/items/[id]` | PUT | 메뉴 수정 | Menu, Upload |
| `/api/admin/menu/items/[id]` | DELETE | 메뉴 삭제 | Menu, Upload |
| `/api/admin/menu/items/[id]/order` | PATCH | 메뉴 순서 변경 | Menu |
| `/api/admin/sse` | GET | SSE 연결 (주문 실시간 업데이트) | SSE |

---

## 3. 서비스 오케스트레이션 패턴

### 주문 생성 플로우
```
Customer UI → POST /api/customer/orders
  → Order Module: createOrder()
  → SSE Module: notifyNewOrder() → Admin UI (실시간)
  → Response: orderNumber
```

### 주문 상태 변경 플로우
```
Admin UI → PATCH /api/admin/orders/[id]/status
  → Order Module: updateOrderStatus()
  → SSE Module: notifyOrderStatusChange() → Customer UI (실시간)
  → SSE Module: broadcastToAdmin() → Admin UI (다른 관리자)
```

### 매장 이용 완료 플로우
```
Admin UI → POST /api/admin/tables/[id]/complete
  → Table Module: endSession()
  → Order Module: 주문 이력 이동
  → SSE Module: broadcastToTable() → Customer UI (세션 리셋)
  → SSE Module: broadcastToAdmin() → Admin UI (테이블 상태 업데이트)
```
