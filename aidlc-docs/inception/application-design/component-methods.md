# 테이블오더 서비스 - 컴포넌트 메서드 정의

## 1. Auth Module

| 메서드 | 입력 | 출력 | 설명 |
|---|---|---|---|
| `loginTable` | storeCode, tableNumber | sessionToken, tableId | 테이블 로그인 및 세션 토큰 발급 |
| `validateSession` | sessionToken | tableId, sessionId, isValid | 세션 토큰 유효성 검증 |
| `getActiveSession` | tableId | TableSession or null | 테이블의 활성 세션 조회 |

---

## 2. Menu Module

| 메서드 | 입력 | 출력 | 설명 |
|---|---|---|---|
| `getCategories` | storeId | Category[] | 매장의 카테고리 목록 조회 (정렬순) |
| `getMenuItems` | categoryId | MenuItem[] | 카테고리별 메뉴 목록 조회 (정렬순) |
| `getAllMenuItems` | storeId | MenuItem[] (with category) | 매장 전체 메뉴 조회 |
| `getMenuItem` | menuItemId | MenuItem | 메뉴 상세 조회 |
| `createMenuItem` | name, price, description, categoryId, image | MenuItem | 메뉴 등록 |
| `updateMenuItem` | menuItemId, updateData | MenuItem | 메뉴 수정 |
| `deleteMenuItem` | menuItemId | void | 메뉴 삭제 |
| `updateMenuOrder` | menuItemId, sortOrder | void | 메뉴 노출 순서 변경 |
| `createCategory` | storeId, name, sortOrder | Category | 카테고리 등록 |
| `updateCategory` | categoryId, updateData | Category | 카테고리 수정 |
| `deleteCategory` | categoryId | void | 카테고리 삭제 |

---

## 3. Order Module

| 메서드 | 입력 | 출력 | 설명 |
|---|---|---|---|
| `createOrder` | tableId, sessionId, items[] | Order (with orderNumber) | 주문 생성 |
| `getOrder` | orderId | Order (with items) | 주문 상세 조회 |
| `getOrdersBySession` | sessionId | Order[] | 세션별 주문 목록 조회 |
| `getOrdersByTable` | tableId, activeOnly | Order[] | 테이블별 주문 조회 |
| `getAllActiveOrders` | storeId | Order[] (grouped by table) | 매장 전체 활성 주문 조회 |
| `updateOrderStatus` | orderId, status | Order | 주문 상태 변경 |
| `deleteOrder` | orderId | void | 주문 삭제 (관리자) |
| `getTableTotalAmount` | tableId, sessionId | number | 테이블 세션 총 주문액 계산 |

---

## 4. Table Module

| 메서드 | 입력 | 출력 | 설명 |
|---|---|---|---|
| `createTable` | storeId, tableNumber | RestaurantTable | 테이블 등록 |
| `updateTable` | tableId, updateData | RestaurantTable | 테이블 정보 수정 |
| `getTables` | storeId | RestaurantTable[] | 매장 테이블 목록 조회 |
| `getTable` | tableId | RestaurantTable | 테이블 상세 조회 |
| `startSession` | tableId | TableSession | 테이블 세션 시작 |
| `endSession` | sessionId | TableSession | 테이블 세션 종료 (이용 완료) |
| `completeTable` | tableId | void | 매장 이용 완료 (세션 종료 + 주문 이력 이동 + 리셋) |
| `getOrderHistory` | tableId, dateFilter | Order[] | 과거 주문 내역 조회 |

---

## 5. SSE Module

| 메서드 | 입력 | 출력 | 설명 |
|---|---|---|---|
| `addConnection` | clientId, type (customer/admin), response | void | SSE 연결 등록 |
| `removeConnection` | clientId | void | SSE 연결 해제 |
| `broadcastToAdmin` | event, data | void | 관리자에게 이벤트 전송 |
| `broadcastToTable` | tableId, event, data | void | 특정 테이블에 이벤트 전송 |
| `notifyNewOrder` | order | void | 신규 주문 알림 |
| `notifyOrderStatusChange` | order | void | 주문 상태 변경 알림 |
| `notifyOrderDeleted` | orderId, tableId | void | 주문 삭제 알림 |

---

## 6. Upload Module

| 메서드 | 입력 | 출력 | 설명 |
|---|---|---|---|
| `uploadImage` | file (multipart) | filePath | 이미지 파일 업로드 및 저장 |
| `deleteImage` | filePath | void | 이미지 파일 삭제 |
| `getImagePath` | filename | string | 이미지 서빙 경로 반환 |

---

## 7. Database Module

| 메서드 | 입력 | 출력 | 설명 |
|---|---|---|---|
| `getDb` | - | Database | SQLite 데이터베이스 인스턴스 반환 |
| `initializeDb` | - | void | 스키마 생성 및 마이그레이션 |
| `seedData` | - | void | 초기 시드 데이터 삽입 |

**참고**: 각 메서드의 상세 비즈니스 규칙은 Functional Design 단계에서 정의됩니다.
