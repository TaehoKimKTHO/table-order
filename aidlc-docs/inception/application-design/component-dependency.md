# 테이블오더 서비스 - 컴포넌트 의존성

## 레이어 아키텍처

```
+-------------------------------------------------------+
|              Presentation Layer (프론트엔드)              |
|   Customer UI (React)    |    Admin UI (React)         |
+-------------------------------------------------------+
                          |
                     HTTP / SSE
                          |
+-------------------------------------------------------+
|              API Layer (Next.js API Routes)             |
|   Customer API Service   |    Admin API Service        |
+-------------------------------------------------------+
                          |
                    직접 함수 호출
                          |
+-------------------------------------------------------+
|              Business Logic Layer (서비스 모듈)           |
|  Auth  |  Menu  |  Order  |  Table  |  SSE  |  Upload  |
+-------------------------------------------------------+
                          |
                    직접 함수 호출
                          |
+-------------------------------------------------------+
|              Data Access Layer (데이터 접근)              |
|                   Database Module                      |
+-------------------------------------------------------+
                          |
+-------------------------------------------------------+
|              Storage Layer (저장소)                      |
|          SQLite           |      File System           |
+-------------------------------------------------------+
```

### 레이어 규칙
1. Presentation → API Layer만 호출 (HTTP/SSE)
2. API Layer → Business Logic Layer만 호출 (직접 함수)
3. Business Logic Layer → Data Access Layer만 호출
4. 상위 레이어가 하위 레이어만 참조 (역방향 참조 금지)
5. 같은 레이어 내 모듈 간 참조는 최소화 (Table → Order만 허용)

---

## 의존성 매트릭스

| 컴포넌트 | 의존 대상 | 관계 유형 | 레이어 |
|---|---|---|---|
| Customer UI | Customer API Service | HTTP/SSE | Presentation → API |
| Admin UI | Admin API Service | HTTP/SSE | Presentation → API |
| Customer API | Auth, Menu, Order, SSE | 직접 호출 | API → Business Logic |
| Admin API | Menu, Order, Table, SSE, Upload | 직접 호출 | API → Business Logic |
| Auth Module | Database Module | 데이터 접근 | Business Logic → Data Access |
| Menu Module | Database Module | 데이터 접근 | Business Logic → Data Access |
| Order Module | Database Module | 데이터 접근 | Business Logic → Data Access |
| Table Module | Database Module, Order Module | 데이터 접근, 오케스트레이션 | Business Logic → Data Access, Business Logic 내부 |
| SSE Module | - (독립) | 이벤트 브로드캐스트 | Business Logic (독립) |
| Upload Module | - (독립) | 파일 시스템 접근 | Business Logic → Storage |
| Database Module | SQLite | 외부 의존성 | Data Access → Storage |

---

## 순환 참조 검증

### 검증 결과: ✅ 순환 참조 없음

의존성 방향 분석:
- Auth → Database ✅ (단방향)
- Menu → Database ✅ (단방향)
- Order → Database ✅ (단방향)
- Table → Database, Order ✅ (단방향)
- SSE → 없음 ✅ (독립)
- Upload → 없음 ✅ (독립)

유일한 Business Logic 내부 참조: Table → Order
- Table Module의 `completeTable()`이 Order Module의 주문 이력 이동 기능을 호출
- Order Module은 Table Module을 참조하지 않음 → 순환 없음

---

## 컴포넌트 간 인터페이스 (호출 관계)

### Customer API → 모듈 호출 매핑
| API 엔드포인트 | 호출 모듈 | 호출 메서드 |
|---|---|---|
| POST /api/customer/auth/login | Auth | loginTable() |
| GET /api/customer/auth/validate | Auth | validateSession() |
| GET /api/customer/menu | Menu | getAllMenuItems() |
| GET /api/customer/menu/[categoryId] | Menu | getMenuItems() |
| POST /api/customer/orders | Order, SSE | createOrder(), notifyNewOrder() |
| GET /api/customer/orders | Order | getOrdersBySession() |
| GET /api/customer/orders/[orderId] | Order | getOrder() |
| GET /api/customer/sse | SSE | addConnection() |

### Admin API → 모듈 호출 매핑
| API 엔드포인트 | 호출 모듈 | 호출 메서드 |
|---|---|---|
| GET /api/admin/orders | Order | getAllActiveOrders() |
| PATCH /api/admin/orders/[id]/status | Order, SSE | updateOrderStatus(), notifyOrderStatusChange() |
| DELETE /api/admin/orders/[id] | Order, SSE | deleteOrder(), notifyOrderDeleted() |
| GET /api/admin/tables | Table | getTables() |
| POST /api/admin/tables | Table | createTable() |
| PUT /api/admin/tables/[id] | Table | updateTable() |
| POST /api/admin/tables/[id]/complete | Table, SSE | completeTable(), broadcastToTable(), broadcastToAdmin() |
| GET /api/admin/tables/[id]/history | Table | getOrderHistory() |
| GET/POST/PUT/DELETE /api/admin/menu/* | Menu, Upload | 해당 CRUD 메서드 |
| GET /api/admin/sse | SSE | addConnection() |

### Business Logic 내부 호출
| 호출자 | 피호출자 | 메서드 | 사유 |
|---|---|---|---|
| Table Module (completeTable) | Order Module | getOrdersBySession() | 이용 완료 시 주문 이력 조회 |

---

## 통신 패턴

### 동기 통신 (HTTP)
- Customer UI ↔ Customer API: REST API 호출
- Admin UI ↔ Admin API: REST API 호출
- API Routes → Backend Modules: 직접 함수 호출

### 비동기 통신 (SSE)
- SSE Module → Customer UI: 주문 상태 변경 이벤트
- SSE Module → Admin UI: 신규 주문, 상태 변경, 삭제 이벤트

## 데이터 흐름도

```
+------------------+     HTTP/SSE     +------------------+
|   Customer UI    | <--------------> | Customer API     |
+------------------+                  +------------------+
                                            |
                                      +-----+-----+-----+
                                      |     |     |     |
                                      v     v     v     v
                                    Auth  Menu  Order  SSE
                                      |     |     |
                                      v     v     v
                                    +------------------+
                                    | Database Module  |
                                    +------------------+
                                            |
                                            v
                                    +------------------+
                                    |     SQLite       |
                                    +------------------+

+------------------+     HTTP/SSE     +------------------+
|    Admin UI      | <--------------> |   Admin API      |
+------------------+                  +------------------+
                                            |
                                +-----+-----+-----+-----+
                                |     |     |     |     |
                                v     v     v     v     v
                              Menu  Order Table  SSE  Upload
                                |     |     |           |
                                v     v     v           v
                              +------------------+  File System
                              | Database Module  |
                              +------------------+
```

## 핵심 의존성 규칙
1. UI 컴포넌트는 API Service를 통해서만 백엔드에 접근 (Presentation → API)
2. API Routes는 백엔드 모듈을 직접 호출 (API → Business Logic)
3. 모든 데이터 접근은 Database Module을 통해 수행 (Business Logic → Data Access)
4. SSE Module은 다른 모듈에 의존하지 않음 (이벤트 수신만)
5. Table Module → Order Module 단방향 의존 (이용 완료 시 주문 이력 처리)
6. 역방향 참조 금지: 하위 레이어가 상위 레이어를 참조하지 않음
7. 순환 참조 없음 검증 완료
