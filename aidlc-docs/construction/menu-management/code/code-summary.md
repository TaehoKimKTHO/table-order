# Unit 3: 메뉴 관리 - 코드 생성 요약

## 생성된 파일

### 타입 정의 (3개)
| 파일 | 설명 |
|---|---|
| `src/types/error.ts` | 공통 에러 코드 + AppError 클래스 (전체 유닛 공유) |
| `src/types/menu.ts` | Category, MenuItem, CategoryWithItems 등 타입/인터페이스 |
| `src/types/upload.ts` | 이미지 업로드 상수 및 타입 |

### 비즈니스 로직 (4개)
| 파일 | 설명 |
|---|---|
| `src/lib/upload/index.ts` | uploadImage, deleteImage, getImagePath |
| `src/lib/menu/category.ts` | getCategories, createCategory, updateCategory, deleteCategory |
| `src/lib/menu/menu-item.ts` | getMenuItems, getAllMenuItems, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem, updateMenuOrder |
| `src/lib/menu/index.ts` | 모듈 re-export |

### 단위 테스트 (3개)
| 파일 | 설명 |
|---|---|
| `src/lib/upload/__tests__/upload.test.ts` | Upload Module 테스트 (6 cases) |
| `src/lib/menu/__tests__/category.test.ts` | Category CRUD 테스트 (9 cases) |
| `src/lib/menu/__tests__/menu-item.test.ts` | MenuItem CRUD 테스트 (15 cases) |

## 의존성
- Unit 1 (Database Module): `src/lib/db/` — getDb() 함수 import
- Unit 1 코드 생성 후 테스트 실행 가능

## 스토리 커버리지
| 스토리 | 상태 |
|---|---|
| US-C02 (메뉴 조회) | ✅ 백엔드 로직 완료 |
| US-A07 (메뉴 조회-관리자) | ✅ 백엔드 로직 완료 |
| US-A08 (메뉴 등록) | ✅ 백엔드 로직 완료 |
| US-A09 (메뉴 수정/삭제) | ✅ 백엔드 로직 완료 |
