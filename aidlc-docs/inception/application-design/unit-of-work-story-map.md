# 테이블오더 서비스 - Unit of Work ↔ Story 매핑

## 매핑 테이블

| Unit | 관련 스토리 | 설명 |
|---|---|---|
| Unit 1: 공통 API | US-C01 | 테이블 자동 로그인 (Auth + DB + SSE 인프라) |
| Unit 2: 주문 처리 | - | 인프라 유닛 (주문 비즈니스 로직, 스토리 직접 매핑 없음) |
| Unit 3: 메뉴 관리 | - | 인프라 유닛 (메뉴 비즈니스 로직, 스토리 직접 매핑 없음) |
| Unit 4: 고객 주문 | US-C02, US-C03, US-C04, US-C05 | 메뉴 조회, 장바구니, 주문 생성, 주문 내역 |
| Unit 5: 관리자 대시보드 | US-A01 ~ US-A09 | 주문 모니터링, 상태 변경, 테이블 관리, 메뉴 관리 |

## 상세 매핑

### Unit 1: 공통 API
| 스토리 | 구현 내용 |
|---|---|
| US-C01: 테이블 자동 로그인 | Auth Module (loginTable, validateSession, getActiveSession), Database Module (스키마, 시드), SSE Module (연결 관리, 브로드캐스트), 공통 타입 정의, 프로젝트 초기화 |

### Unit 2: 주문 처리
- 직접 매핑되는 스토리 없음 (비즈니스 로직 유닛)
- Unit 4(고객 주문)와 Unit 5(관리자 대시보드)의 기반이 되는 주문 처리 로직 제공
- 관련 스토리: US-C04(주문 생성), US-C05(주문 내역), US-A01(주문 모니터링), US-A02(상태 변경), US-A04(주문 삭제)의 백엔드 로직 담당

### Unit 3: 메뉴 관리
- 직접 매핑되는 스토리 없음 (비즈니스 로직 유닛)
- Unit 4(고객 주문)와 Unit 5(관리자 대시보드)의 기반이 되는 메뉴 관리 로직 제공
- 관련 스토리: US-C02(메뉴 조회), US-A07(메뉴 조회), US-A08(메뉴 등록), US-A09(메뉴 수정/삭제)의 백엔드 로직 담당

### Unit 4: 고객 주문
| 스토리 | 구현 내용 (API Route + UI) |
|---|---|
| US-C02: 메뉴 조회 및 탐색 | GET /api/customer/menu Route, GET /api/customer/menu/[categoryId] Route, 메뉴 조회 페이지 UI |
| US-C03: 장바구니 관리 | 장바구니 UI 컴포넌트 (로컬 저장, 수량 조절, 금액 계산) |
| US-C04: 주문 생성 | POST /api/customer/orders Route, 주문 확인/생성 페이지 UI |
| US-C05: 주문 내역 조회 | GET /api/customer/orders Route, GET /api/customer/orders/[orderId] Route, GET /api/customer/sse Route, 주문 내역 페이지 UI, SSE 실시간 상태 업데이트 UI |

### Unit 5: 관리자 대시보드
| 스토리 | 구현 내용 (Table Module + API Route + UI) |
|---|---|
| US-A01: 실시간 주문 모니터링 | GET /api/admin/orders Route, GET /api/admin/sse Route, 대시보드 그리드 UI, 신규 주문 강조 |
| US-A02: 주문 상태 변경 | PATCH /api/admin/orders/[id]/status Route, 상태 변경 UI, 테이블별 필터링 |
| US-A03: 테이블 초기 설정 | Table.createTable(), POST /api/admin/tables Route, 테이블 등록 UI |
| US-A04: 주문 삭제 | DELETE /api/admin/orders/[id] Route, 삭제 확인 팝업 UI |
| US-A05: 매장 이용 완료 | Table.completeTable(), POST /api/admin/tables/[id]/complete Route, 이용 완료 UI |
| US-A06: 과거 주문 내역 | Table.getOrderHistory(), GET /api/admin/tables/[id]/history Route, 과거 내역 조회 UI |
| US-A07: 메뉴 조회 (관리자) | GET /api/admin/menu/items Route, GET /api/admin/menu/categories Route, 메뉴 목록 UI |
| US-A08: 메뉴 등록 | POST /api/admin/menu/items Route, POST /api/admin/menu/categories Route, 메뉴 등록 UI |
| US-A09: 메뉴 수정/삭제 | PUT/DELETE /api/admin/menu/* Routes, PATCH /api/admin/menu/items/[id]/order Route, 메뉴 수정/삭제 UI |

## 스토리 커버리지 검증

| 스토리 | Unit 할당 | 상태 |
|---|---|---|
| US-C01 | Unit 1 | ✅ |
| US-C02 | Unit 4 (백엔드: Unit 3) | ✅ |
| US-C03 | Unit 4 | ✅ |
| US-C04 | Unit 4 (백엔드: Unit 2) | ✅ |
| US-C05 | Unit 4 (백엔드: Unit 2) | ✅ |
| US-A01 | Unit 5 (백엔드: Unit 2) | ✅ |
| US-A02 | Unit 5 (백엔드: Unit 2) | ✅ |
| US-A03 | Unit 5 | ✅ |
| US-A04 | Unit 5 (백엔드: Unit 2) | ✅ |
| US-A05 | Unit 5 (백엔드: Unit 2) | ✅ |
| US-A06 | Unit 5 | ✅ |
| US-A07 | Unit 5 (백엔드: Unit 3) | ✅ |
| US-A08 | Unit 5 (백엔드: Unit 3) | ✅ |
| US-A09 | Unit 5 (백엔드: Unit 3) | ✅ |

**전체 14개 스토리가 5개 유닛에 100% 할당 완료. 유닛 간 모듈 겹침 없음.**
