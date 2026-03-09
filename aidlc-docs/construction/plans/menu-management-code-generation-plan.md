# Unit 3: 메뉴 관리 - Code Generation Plan

## Unit Context
- **Unit Name**: 메뉴 관리 (Menu Management)
- **포함 모듈**: Menu Module, Upload Module
- **파일 범위**: `src/lib/menu/`, `src/lib/upload/`
- **의존성**: Unit 1 (Database Module — `src/lib/db/`)
- **관련 스토리**: US-C02, US-A07, US-A08, US-A09 (백엔드 로직 담당)

## 선행 조건
- [x] Unit 3 Functional Design 완료
- 참고: Unit 1 코드 미생성 상태이므로, Unit 1 Database Module 인터페이스를 stub/import 형태로 참조

## Code Generation Steps

### Step 1: 프로젝트 구조 및 공통 타입 설정
- [x] `src/types/menu.ts` — Menu, Category, MenuItem 관련 TypeScript 타입/인터페이스 정의
- [x] `src/types/upload.ts` — Upload 관련 타입 정의
- [x] `src/types/error.ts` — 공통 에러 코드 및 AppError 클래스 정의 (Unit 1과 공유)

### Step 2: Upload Module 구현
- [x] `src/lib/upload/index.ts` — uploadImage, deleteImage, getImagePath 구현

### Step 3: Menu Module 구현 — 카테고리 CRUD
- [x] `src/lib/menu/category.ts` — getCategories, createCategory, updateCategory, deleteCategory 구현

### Step 4: Menu Module 구현 — 메뉴 CRUD
- [x] `src/lib/menu/menu-item.ts` — getMenuItems, getAllMenuItems, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem, updateMenuOrder 구현

### Step 5: Menu Module 인덱스
- [x] `src/lib/menu/index.ts` — 모듈 re-export (category + menu-item)

### Step 6: Unit Test — Upload Module
- [x] `src/lib/upload/__tests__/upload.test.ts` — uploadImage, deleteImage, getImagePath 테스트

### Step 7: Unit Test — Menu Module
- [x] `src/lib/menu/__tests__/category.test.ts` — 카테고리 CRUD 테스트
- [x] `src/lib/menu/__tests__/menu-item.test.ts` — 메뉴 CRUD 테스트

### Step 8: Documentation
- [x] `aidlc-docs/construction/menu-management/code/code-summary.md` — 코드 생성 요약

## 파일 목록 (총 9개)

| 파일 | 유형 | 설명 |
|---|---|---|
| `src/types/menu.ts` | 타입 | 메뉴/카테고리 타입 정의 |
| `src/types/upload.ts` | 타입 | 업로드 타입 정의 |
| `src/types/error.ts` | 타입 | 공통 에러 클래스 |
| `src/lib/upload/index.ts` | 비즈니스 로직 | 이미지 업로드/삭제/경로 |
| `src/lib/menu/category.ts` | 비즈니스 로직 | 카테고리 CRUD |
| `src/lib/menu/menu-item.ts` | 비즈니스 로직 | 메뉴 CRUD |
| `src/lib/menu/index.ts` | 인덱스 | 모듈 re-export |
| `src/lib/upload/__tests__/upload.test.ts` | 테스트 | Upload 단위 테스트 |
| `src/lib/menu/__tests__/category.test.ts` | 테스트 | 카테고리 단위 테스트 |
| `src/lib/menu/__tests__/menu-item.test.ts` | 테스트 | 메뉴 단위 테스트 |
| `aidlc-docs/construction/menu-management/code/code-summary.md` | 문서 | 코드 요약 |

## 스토리 매핑

| 스토리 | 구현 내용 |
|---|---|
| US-C02 (메뉴 조회) | getCategories, getMenuItems, getAllMenuItems, getMenuItem |
| US-A07 (메뉴 조회-관리자) | getAllMenuItems, getCategories |
| US-A08 (메뉴 등록) | createMenuItem, createCategory, uploadImage |
| US-A09 (메뉴 수정/삭제) | updateMenuItem, deleteMenuItem, updateMenuOrder, updateCategory, deleteCategory, deleteImage |

## 기술 스택
- TypeScript (strict mode)
- Node.js fs/promises (파일 I/O)
- crypto.randomUUID() (UUID 생성)
- path (경로 처리)
- Unit 1 Database Module import (better-sqlite3 기반 getDb())
