# 테이블오더 서비스 - 요구사항 문서

## 1. 의도 분석 요약

| 항목 | 내용 |
|---|---|
| **사용자 요청** | 디지털 테이블오더 서비스 구축 (고객 주문 + 관리자 모니터링) |
| **요청 유형** | 신규 프로젝트 (Greenfield) |
| **범위 추정** | 시스템 전체 (풀스택 웹 애플리케이션) |
| **복잡도 추정** | 중간 (Moderate) - 실시간 통신, 세션 관리, CRUD 등 다수 기능 포함 |

---

## 2. 기술 결정 사항

| 항목 | 결정 |
|---|---|
| **프레임워크** | TypeScript + Next.js (풀스택) |
| **데이터베이스** | SQLite (경량 관계형 DB) |
| **이미지 관리** | 서버 로컬 파일 시스템 업로드/저장 |
| **관리자 계정** | 사전 설정된 단일 관리자 계정 (DB 직접 등록) |
| **배포 환경** | 로컬 개발 환경 (Docker Compose) |
| **규모** | 소규모 (1개 매장, 테이블 10개 이하, 관리자 1-2명) |
| **실시간 통신** | Server-Sent Events (SSE) |
| **보안 확장** | 미적용 (프로토타입/MVP 수준) |

---

## 3. 기능 요구사항

### 3.1 고객용 기능 (Customer Features)

#### FR-C01: 테이블 태블릿 자동 로그인 및 세션 관리
- 관리자가 1회 초기 설정 수행 (매장 식별자, 테이블 번호)
- 로그인 정보 로컬 저장 후 자동 로그인 (매장코드 + 테이블번호)
- 세션 만료 없음 (매장 이용 완료 처리 시에만 세션 리셋)

#### FR-C02: 메뉴 조회 및 탐색
- 메뉴 화면이 기본 화면으로 항상 표시
- 카테고리별 메뉴 분류 및 표시
- 메뉴 상세 정보: 메뉴명, 가격, 설명, 이미지
- 카테고리 간 빠른 이동
- 카드 형태 레이아웃, 터치 친화적 버튼 (최소 44x44px)

#### FR-C03: 장바구니 관리
- 메뉴 추가/삭제, 수량 조절
- 총 금액 실시간 계산
- 장바구니 비우기
- 클라이언트 측 로컬 저장 (페이지 새로고침 시 유지)
- 서버 전송은 주문 확정 시에만 수행

#### FR-C04: 주문 생성
- 주문 내역 최종 확인 후 주문 확정
- 주문 성공 시: 주문 번호 표시, 장바구니 자동 비우기, 5초 후 메뉴 화면 자동 리다이렉트
- 주문 실패 시: 에러 메시지 표시, 장바구니 유지
- 주문 정보: 매장 식별, 테이블 식별, 메뉴 목록(메뉴명, 수량, 단가), 총 금액, 세션 ID

#### FR-C05: 주문 내역 조회
- 주문 시간 순 정렬
- 주문별 상세: 주문 번호, 시각, 메뉴/수량, 금액, 상태(대기중/준비중/완료)
- SSE 기반 주문 상태 실시간 업데이트
- 현재 테이블 세션 주문만 표시 (이전 세션 제외)
- 매장 이용 완료 처리된 주문 제외

### 3.2 관리자용 기능 (Admin Features)

#### FR-A01: 실시간 주문 모니터링|
- SSE 기반 주문 목록 실시간 업데이트
- 그리드/대시보드 레이아웃: 테이블별 카드 형태
- 각 테이블 카드: 총 주문액 표시
- 주문 카드 클릭 시 전체 메뉴 목록 상세 보기
- 주문 상태 변경 (대기중 → 준비중 → 완료)
- 신규 주문 시각적 강조 (색상 변경, 애니메이션)
- 2초 이내 주문 표시
- 테이블별 필터링

#### FR-A02: 테이블 관리
- **초기 설정**: 테이블 번호 및 비밀번호 설정
- **주문 삭제**: 확인 팝업 후 즉시 삭제, 총 주문액 재계산
- **매장 이용 완료**: 확인 팝업 후 세션 종료, 주문 내역 과거 이력 이동, 현재 주문/총액 리셋
- **과거 주문 내역 조회**: 테이블별 과거 주문 목록 (시간 역순), 날짜 필터링

#### FR-A03: 메뉴 관리
- 메뉴 조회 (카테고리별)
- 메뉴 등록: 메뉴명, 가격, 설명, 카테고리, 이미지 업로드
- 메뉴 수정
- 메뉴 삭제
- 메뉴 노출 순서 조정
- 필수 필드 검증, 가격 범위 검증

---

## 4. 비기능 요구사항

### NFR-01: 성능
- SSE 기반 실시간 주문 알림 2초 이내 전달
- 소규모 환경 (테이블 10개 이하) 기준 최적화

### NFR-02: 사용성
- 터치 친화적 UI (최소 44x44px 터치 타겟)
- 직관적인 카드 기반 레이아웃
- 명확한 시각적 계층 구조

### NFR-03: 데이터 관리
- SQLite 단일 파일 데이터베이스
- 주문 이력 영구 보관 (OrderHistory)
- 세션 ID 기반 주문 그룹화

### NFR-04: 배포
- Docker Compose 기반 로컬 개발 환경
- 단일 컨테이너 또는 최소 컨테이너 구성

---

## 5. 제외 사항

다음 기능은 구현 범위에서 제외됩니다:
- 결제 처리 (카드, 현금, PG사 연동, 영수증, 환불, 포인트/쿠폰)
- 복잡한 인증 (OAuth, SNS 로그인, 2FA)
- 이미지 리사이징/최적화, CMS, 광고
- 알림 시스템 (푸시, SMS, 이메일, 소리/진동)
- 주방 기능 (주방 전달, 재고 관리)
- 고급 기능 (데이터 분석, 매출 리포트, 직원 관리, 예약, 리뷰, 다국어)
- 외부 연동 (배달 플랫폼, POS, 소셜 미디어, 지도/번역 API)

---

## 6. 데이터 모델 개요

### 핵심 엔티티

#### Store (매장)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | INTEGER (PK) | 매장 고유 ID (자동 증가) |
| name | TEXT (NOT NULL) | 매장명 |
| storeCode | TEXT (UNIQUE, NOT NULL) | 매장 식별 코드 |
| createdAt | DATETIME | 생성 시각 |

#### RestaurantTable (테이블)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | INTEGER (PK) | 테이블 고유 ID (자동 증가) |
| storeId | INTEGER (FK → Store) | 소속 매장 |
| tableNumber | INTEGER (NOT NULL) | 테이블 번호 |
| isOccupied | BOOLEAN | 현재 사용 중 여부 |
| createdAt | DATETIME | 생성 시각 |

#### TableSession (테이블 세션)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | INTEGER (PK) | 세션 고유 ID (자동 증가) |
| tableId | INTEGER (FK → RestaurantTable) | 테이블 참조 |
| sessionToken | TEXT (UNIQUE, NOT NULL) | 세션 식별 토큰 |
| startedAt | DATETIME (NOT NULL) | 세션 시작 시각 (첫 주문 시) |
| endedAt | DATETIME (NULL) | 세션 종료 시각 (이용 완료 시, NULL이면 활성) |
| status | TEXT | 세션 상태 (active / completed) |

#### Category (메뉴 카테고리)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | INTEGER (PK) | 카테고리 고유 ID (자동 증가) |
| storeId | INTEGER (FK → Store) | 소속 매장 |
| name | TEXT (NOT NULL) | 카테고리명 |
| sortOrder | INTEGER | 표시 순서 |
| createdAt | DATETIME | 생성 시각 |

#### MenuItem (메뉴 항목)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | INTEGER (PK) | 메뉴 고유 ID (자동 증가) |
| categoryId | INTEGER (FK → Category) | 소속 카테고리 |
| name | TEXT (NOT NULL) | 메뉴명 |
| price | INTEGER (NOT NULL) | 가격 (원 단위) |
| description | TEXT | 메뉴 설명 |
| imagePath | TEXT | 이미지 파일 경로 (서버 로컬) |
| sortOrder | INTEGER | 카테고리 내 표시 순서 |
| isAvailable | BOOLEAN | 판매 가능 여부 |
| createdAt | DATETIME | 생성 시각 |
| updatedAt | DATETIME | 수정 시각 |

#### Order (주문)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | INTEGER (PK) | 주문 고유 ID (자동 증가) |
| tableId | INTEGER (FK → RestaurantTable) | 주문 테이블 |
| sessionId | INTEGER (FK → TableSession) | 소속 세션 |
| orderNumber | TEXT (UNIQUE, NOT NULL) | 주문 번호 (표시용) |
| status | TEXT (NOT NULL) | 주문 상태 (pending / preparing / completed) |
| totalAmount | INTEGER (NOT NULL) | 총 주문 금액 (원 단위) |
| createdAt | DATETIME (NOT NULL) | 주문 시각 |
| updatedAt | DATETIME | 상태 변경 시각 |

#### OrderItem (주문 항목)
| 필드 | 타입 | 설명 |
|---|---|---|
| id | INTEGER (PK) | 주문 항목 고유 ID (자동 증가) |
| orderId | INTEGER (FK → Order) | 소속 주문 |
| menuItemId | INTEGER (FK → MenuItem) | 메뉴 참조 |
| menuName | TEXT (NOT NULL) | 주문 시점 메뉴명 (스냅샷) |
| quantity | INTEGER (NOT NULL) | 수량 |
| unitPrice | INTEGER (NOT NULL) | 주문 시점 단가 (스냅샷) |
| subtotal | INTEGER (NOT NULL) | 소계 (quantity × unitPrice) |

### 엔티티 관계
- Store 1 : N RestaurantTable
- Store 1 : N Category
- RestaurantTable 1 : N TableSession
- RestaurantTable 1 : N Order
- TableSession 1 : N Order
- Category 1 : N MenuItem
- Order 1 : N OrderItem
- MenuItem 1 : N OrderItem

---

## 7. 용어 정의

| 용어 | 정의 |
|---|---|
| **테이블 세션** | 고객이 테이블에서 첫 주문 시작부터 매장 이용 완료 처리까지의 기간 |
| **매장 이용 완료** | 관리자가 테이블 세션을 종료하는 행위. 주문 내역이 과거 이력으로 이동 |
| **자동 로그인** | 1회 설정 후 저장된 정보로 별도 입력 없이 로그인 |
| **SSE** | Server-Sent Events. 서버에서 클라이언트로 단방향 실시간 데이터 전송 |
