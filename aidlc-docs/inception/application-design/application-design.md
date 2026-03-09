# 테이블오더 서비스 - 애플리케이션 설계 통합 문서

## 1. 아키텍처 개요

TypeScript + Next.js (App Router) 기반 풀스택 애플리케이션으로, 프론트엔드와 백엔드가 하나의 프로젝트에 공존합니다. SQLite를 데이터베이스로 사용하며, SSE를 통한 실시간 통신을 지원합니다.

### 기술 스택
- **프론트엔드**: Next.js App Router + React + TypeScript
- **백엔드**: Next.js API Routes + TypeScript
- **데이터베이스**: SQLite (better-sqlite3 또는 Drizzle ORM)
- **실시간 통신**: Server-Sent Events (SSE)
- **이미지 저장**: 로컬 파일 시스템 (public/uploads)
- **배포**: Docker Compose

### 프로젝트 구조
```
table-order/
+-- src/
|   +-- app/                    # Next.js App Router
|   |   +-- customer/           # 고객용 페이지 (Unit 4)
|   |   +-- admin/              # 관리자용 페이지 (Unit 5)
|   |   +-- api/                # API Routes
|   |       +-- customer/       # 고객용 API (Unit 4)
|   |       +-- admin/          # 관리자용 API (Unit 5)
|   +-- lib/                    # 백엔드 모듈
|   |   +-- auth/               # Auth Module (Unit 1)
|   |   +-- menu/               # Menu Module (Unit 3)
|   |   +-- order/              # Order Module (Unit 2)
|   |   +-- table/              # Table Module (Unit 5)
|   |   +-- sse/                # SSE Module (Unit 1)
|   |   +-- upload/             # Upload Module (Unit 3)
|   |   +-- db/                 # Database Module (Unit 1)
|   +-- components/             # React 컴포넌트
|   |   +-- common/             # 공통 컴포넌트 (Unit 1)
|   |   +-- customer/           # 고객 컴포넌트 (Unit 4)
|   |   +-- admin/              # 관리자 컴포넌트 (Unit 5)
|   +-- types/                  # TypeScript 타입 정의 (Unit 1)
+-- public/
|   +-- uploads/                # 메뉴 이미지 저장
+-- data/
|   +-- table-order.db          # SQLite 데이터베이스 파일
+-- docker-compose.yml
+-- Dockerfile
```

---

## 2. 레이어 아키텍처

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

상세: [component-dependency.md](component-dependency.md)

---

## 3. 컴포넌트 구성

### 프론트엔드 (2개)
| 컴포넌트 | 경로 | 설명 |
|---|---|---|
| Customer UI | `/customer/*` | 고객 주문 인터페이스 (Unit 4) |
| Admin UI | `/admin/*` | 관리자 관리 인터페이스 (Unit 5) |

### 백엔드 모듈 (7개)
| 모듈 | 경로 | 유닛 | 설명 |
|---|---|---|---|
| Database | `src/lib/db/` | Unit 1 | SQLite 접근 및 스키마 |
| Auth | `src/lib/auth/` | Unit 1 | 테이블 인증 및 세션 관리 |
| SSE | `src/lib/sse/` | Unit 1 | 실시간 이벤트 통신 |
| Order | `src/lib/order/` | Unit 2 | 주문 생성/상태/조회/관리 |
| Menu | `src/lib/menu/` | Unit 3 | 메뉴/카테고리 조회 및 CRUD |
| Upload | `src/lib/upload/` | Unit 3 | 이미지 파일 관리 |
| Table | `src/lib/table/` | Unit 5 | 테이블/세션 관리 |

상세: [components.md](components.md)

---

## 4. API 엔드포인트

### Customer API (8개 엔드포인트)
- 인증: login, validate (Unit 1 Auth 모듈 호출)
- 메뉴: 전체 조회, 카테고리별 조회 (Unit 3 Menu 모듈 호출)
- 주문: 생성, 목록 조회, 상세 조회 (Unit 2 Order 모듈 호출)
- SSE: 실시간 연결 (Unit 1 SSE 모듈 호출)
- API Route 구현: Unit 4

### Admin API (17개 엔드포인트)
- 주문: 전체 조회, 상태 변경, 삭제 (Unit 2 Order 모듈 호출)
- 테이블: 목록, 등록, 수정, 이용 완료, 과거 내역 (Unit 5 Table 모듈)
- 메뉴: 카테고리 CRUD, 메뉴 CRUD, 순서 변경 (Unit 3 Menu 모듈 호출)
- SSE: 실시간 연결 (Unit 1 SSE 모듈 호출)
- API Route 구현: Unit 5

상세: [services.md](services.md)

---

## 5. 메서드 시그니처

7개 모듈에 걸쳐 총 38개 메서드가 정의되어 있습니다.

상세: [component-methods.md](component-methods.md)

---

## 6. 의존성 관계

- UI → API Service → Backend Modules → Database Module → SQLite
- SSE Module은 독립적으로 이벤트 브로드캐스트 담당
- Table Module → Order Module 의존 (이용 완료 시 주문 이력 처리)
- 순환 참조 없음 검증 완료

상세: [component-dependency.md](component-dependency.md)

---

## 7. Unit of Work 구성 (5개 유닛, 겹침 없음)

사용자 기준 3개 유닛(고객 주문, 관리자 대시보드, 공통 API)에서 중첩되는 Menu Module과 Order Module을 별도 유닛으로 분리하여 5개 유닛으로 구성합니다.

| Unit | 목적 | 파일 범위 | 스토리 수 |
|---|---|---|---|
| Unit 1: 공통 API | 인증, 데이터 접근, SSE | `src/lib/db/`, `src/lib/auth/`, `src/lib/sse/`, `src/types/` | 1 (US-C01) |
| Unit 2: 주문 처리 | 주문 비즈니스 로직 | `src/lib/order/` | 0 (인프라) |
| Unit 3: 메뉴 관리 | 메뉴/카테고리/이미지 로직 | `src/lib/menu/`, `src/lib/upload/` | 0 (인프라) |
| Unit 4: 고객 주문 | 고객 API Route + UI | `src/app/api/customer/`, `src/app/customer/`, `src/components/customer/` | 4 (US-C02~C05) |
| Unit 5: 관리자 대시보드 | 관리자 API Route + UI + Table | `src/lib/table/`, `src/app/api/admin/`, `src/app/admin/`, `src/components/admin/` | 9 (US-A01~A09) |

### 구현 순서
1. Phase 1: Unit 1 (필수 선행)
2. Phase 2: Unit 2 + Unit 3 (병렬 개발 가능)
3. Phase 3: Unit 4 + Unit 5 (병렬 개발 가능)

### 중첩 분리 원칙
- Menu Module과 Order Module이 고객/관리자 양쪽에서 사용되므로 별도 유닛(Unit 2, 3)으로 분리
- Unit 4/5는 Unit 2/3의 모듈을 import하여 호출만 수행
- 모든 유닛의 파일 범위가 완전히 분리됨

상세: [unit-of-work.md](unit-of-work.md), [unit-of-work-dependency.md](unit-of-work-dependency.md), [unit-of-work-story-map.md](unit-of-work-story-map.md)

---

## 8. 실시간 통신 설계

### SSE 이벤트 타입
| 이벤트 | 대상 | 트리거 |
|---|---|---|
| `order:new` | Admin | 고객이 새 주문 생성 |
| `order:status` | Customer, Admin | 관리자가 주문 상태 변경 |
| `order:deleted` | Customer, Admin | 관리자가 주문 삭제 |
| `table:completed` | Customer | 관리자가 이용 완료 처리 |

### 연결 관리
- 고객: 테이블별 SSE 연결 (sessionToken 기반)
- 관리자: 매장 전체 SSE 연결
- 연결 해제 시 자동 정리
