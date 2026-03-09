# Unit Test Execution

## 개요

현재 구현된 유닛별 단위 테스트 현황:

| 유닛 | 테스트 파일 | 테스트 케이스 | 상태 |
|---|---|---|---|
| Unit 3: 메뉴 관리 | 3개 | 30개 | Unit 1 DB 구현 후 실행 가능 |
| Unit 4: 고객 주문 | 0개 (UI 중심) | — | 통합 테스트로 커버 |

## 테스트 실행

### 1. 전체 단위 테스트 실행

```bash
cd table-order
npm run test
```

또는 특정 파일만:

```bash
npx vitest run src/lib/menu/__tests__/category.test.ts
npx vitest run src/lib/menu/__tests__/menu-item.test.ts
npx vitest run src/lib/upload/__tests__/upload.test.ts
```

### 2. 테스트 결과 확인
- **기대 결과**: 30개 테스트 통과, 0 실패
- **테스트 커버리지**: Menu Module 90%+, Upload Module 85%+
- **리포트 위치**: 터미널 출력

### 3. 실패 시 대응
1. 터미널 출력에서 실패 테스트 확인
2. 에러 메시지 분석 (assertion 실패 vs 런타임 에러)
3. 코드 수정 후 재실행

## 테스트 상세

### Unit 3: Upload Module (6 cases)
| 테스트 | 설명 |
|---|---|
| uploadImage — 유효한 이미지 업로드 | JPEG/PNG 파일 정상 저장 |
| uploadImage — 허용되지 않는 확장자 | 에러 발생 확인 |
| uploadImage — 5MB 초과 파일 | 에러 발생 확인 |
| deleteImage — 이미지 삭제 | 파일 삭제 확인 |
| deleteImage — 존재하지 않는 파일 | 에러 없이 처리 |
| getImagePath — 경로 반환 | 올바른 경로 형식 확인 |

### Unit 3: Category CRUD (9 cases)
| 테스트 | 설명 |
|---|---|
| getCategories — 목록 조회 | sortOrder 순 정렬 확인 |
| getCategories — 없는 매장 | 빈 배열 반환 |
| createCategory — 생성 | 정상 생성 확인 |
| createCategory — sortOrder 지정 | 지정 순서 반영 |
| createCategory — 빈 이름 | 에러 발생 |
| createCategory — 50자 초과 | 에러 발생 |
| createCategory — 중복 이름 | 에러 발생 |
| updateCategory — 수정 | 이름 변경 확인 |
| deleteCategory — 삭제 | 삭제 후 조회 불가 확인 |

### Unit 3: MenuItem CRUD (15 cases)
| 테스트 | 설명 |
|---|---|
| getMenuItems — 카테고리별 조회 | 판매 가능 메뉴만 반환 |
| getAllMenuItems — 전체 조회 | 카테고리별 그룹핑 |
| getMenuItem — 상세 조회 | 메뉴 정보 확인 |
| getMenuItem — 없는 메뉴 | 에러 발생 |
| createMenuItem — 생성 | 정상 생성 확인 |
| createMenuItem — 빈 이름 | 에러 발생 |
| createMenuItem — 100원 미만 | 에러 발생 |
| createMenuItem — 1000만원 초과 | 에러 발생 |
| createMenuItem — 없는 카테고리 | 에러 발생 |
| createMenuItem — 500자 초과 설명 | 에러 발생 |
| updateMenuItem — 수정 | 이름/가격 변경 확인 |
| updateMenuItem — 없는 메뉴 | 에러 발생 |
| updateMenuItem — 판매 상태 변경 | isAvailable 변경 확인 |
| deleteMenuItem — 삭제 | 삭제 후 조회 불가 |
| updateMenuOrder — 순서 변경 | sortOrder 변경 확인 |

## 선행 조건

모든 단위 테스트는 Unit 1(Database Module)이 구현되어야 실행 가능합니다:
- `getDb()` 함수가 초기화된 SQLite 인스턴스를 반환해야 함
- 테스트 실행 전 DB 스키마 초기화 및 시드 데이터 필요
- 테스트 간 DB 상태 격리를 위해 `beforeEach`에서 초기화 권장
