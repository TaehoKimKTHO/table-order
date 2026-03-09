# 테이블오더 서비스 - Unit of Work 의존성

## 의존성 매트릭스

| Unit | 의존 대상 | 관계 | 겹침 |
|---|---|---|---|
| Unit 1: 공통 API | 없음 | 최초 유닛 (인프라 기반) | - |
| Unit 2: 주문 처리 | Unit 1 | Database Module 사용 | 없음 |
| Unit 3: 메뉴 관리 | Unit 1 | Database Module 사용 | 없음 |
| Unit 4: 고객 주문 | Unit 1, 2, 3 | Auth + SSE + Order + Menu 호출 | 없음 |
| Unit 5: 관리자 대시보드 | Unit 1, 2, 3 | SSE + Order + Menu + Upload 호출 | 없음 |

### 유닛 간 겹침 검증: ✅ 없음
- Unit 2와 Unit 3: 서로 독립 (Order ↔ Menu 직접 의존 없음)
- Unit 4와 Unit 5: 서로 독립 (Customer ↔ Admin 파일 범위 분리)
- Unit 4와 Unit 5는 Unit 2, 3의 모듈을 import하여 호출만 수행

## 구현 순서

```
Unit 1 (공통 API)
  |
  +---> Unit 2 (주문 처리) ──── 병렬 가능
  |
  +---> Unit 3 (메뉴 관리) ──── 병렬 가능
          |
          v
Unit 4 (고객 주문) ──── Unit 2, 3 완료 후
          |
Unit 5 (관리자 대시보드) ──── Unit 2, 3 완료 후, Unit 4와 병렬 가능
```

### 권장 구현 순서
1. **Phase 1**: Unit 1 — 공통 API (필수 선행)
2. **Phase 2**: Unit 2 + Unit 3 — 주문 처리 + 메뉴 관리 (병렬 개발 가능)
3. **Phase 3**: Unit 4 + Unit 5 — 고객 주문 + 관리자 대시보드 (병렬 개발 가능)

### 병렬화 가능 구간
- Phase 2: Unit 2와 Unit 3은 서로 독립적이므로 병렬 개발 가능
- Phase 3: Unit 4와 Unit 5는 파일 범위가 완전히 분리되어 병렬 개발 가능

## 통합 테스트 체크포인트

| 체크포인트 | 시점 | 검증 내용 |
|---|---|---|
| CP1 | Unit 1 완료 | DB 스키마/시드, Auth 로그인/세션, SSE 연결 관리 동작 확인 |
| CP2 | Unit 2 완료 | 주문 생성, 조회, 상태 변경, 삭제 단위 테스트 |
| CP3 | Unit 3 완료 | 메뉴/카테고리 CRUD, 이미지 업로드/삭제 단위 테스트 |
| CP4 | Unit 4 완료 | 고객 메뉴 조회 → 장바구니 → 주문 생성 → 주문 내역 E2E 플로우 |
| CP5 | Unit 5 완료 | 관리자 대시보드 실시간 업데이트, 주문 관리, 테이블 관리, 메뉴 CRUD E2E 플로우 |
| CP6 | 전체 통합 | 고객 주문 → 관리자 실시간 수신 → 상태 변경 → 고객 실시간 반영 크로스 유닛 E2E |
