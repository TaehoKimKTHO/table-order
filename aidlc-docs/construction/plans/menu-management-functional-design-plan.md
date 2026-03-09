# Unit 3: 메뉴 관리 - Functional Design Plan

## Unit Context
- **Unit Name**: 메뉴 관리 (Menu Management)
- **포함 모듈**: Menu Module, Upload Module
- **파일 범위**: `src/lib/menu/`, `src/lib/upload/`
- **의존성**: Unit 1 (Database Module)
- **관련 스토리**: US-C02(메뉴 조회), US-A07(메뉴 조회), US-A08(메뉴 등록), US-A09(메뉴 수정/삭제)

## 선행 조건
- [x] Unit 1 Functional Design 완료 (도메인 엔티티, 비즈니스 규칙 정의됨)
- [x] Application Design 완료 (컴포넌트 메서드 정의됨)
- [x] Unit of Work 정의 완료

## Functional Design Steps

### Menu Module
- [x] Step 1: 메뉴 조회 비즈니스 로직 설계 (getCategories, getMenuItems, getAllMenuItems, getMenuItem)
- [x] Step 2: 메뉴 CRUD 비즈니스 로직 설계 (createMenuItem, updateMenuItem, deleteMenuItem)
- [x] Step 3: 메뉴 순서 변경 로직 설계 (updateMenuOrder)
- [x] Step 4: 카테고리 CRUD 비즈니스 로직 설계 (createCategory, updateCategory, deleteCategory)

### Upload Module
- [x] Step 5: 이미지 업로드 비즈니스 로직 설계 (uploadImage)
- [x] Step 6: 이미지 삭제/서빙 로직 설계 (deleteImage, getImagePath)

### 산출물 생성
- [x] Step 7: business-logic-model.md 생성
- [x] Step 8: business-rules.md 생성
- [x] Step 9: domain-entities.md 생성 (Unit 1 엔티티 참조, Unit 3 관점 보완)

## 참조 문서
- `aidlc-docs/construction/common-api/functional-design/domain-entities.md` (Category, MenuItem 엔티티)
- `aidlc-docs/construction/common-api/functional-design/business-rules.md` (VR-04, VR-05 검증 규칙)
- `aidlc-docs/inception/application-design/component-methods.md` (Menu Module, Upload Module 메서드)
