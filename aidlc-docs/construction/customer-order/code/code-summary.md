# Unit 4: 고객 주문 - Code Summary

## 생성 파일 목록

### 타입 정의 (1개)
| 파일 | 설명 |
|---|---|
| `table-order/src/types/order.ts` | Order, OrderItem, CartItemData 타입 정의 |

### API Routes (7개)
| 파일 | 설명 |
|---|---|
| `table-order/src/app/api/customer/auth/login/route.ts` | POST 테이블 로그인 |
| `table-order/src/app/api/customer/auth/validate/route.ts` | GET 세션 검증 |
| `table-order/src/app/api/customer/menu/route.ts` | GET 전체 메뉴 조회 |
| `table-order/src/app/api/customer/menu/[categoryId]/route.ts` | GET 카테고리별 메뉴 |
| `table-order/src/app/api/customer/orders/route.ts` | POST 주문 생성, GET 주문 목록 |
| `table-order/src/app/api/customer/orders/[orderId]/route.ts` | GET 주문 상세 |
| `table-order/src/app/api/customer/sse/route.ts` | GET SSE 연결 |

### 커스텀 훅 (3개)
| 파일 | 설명 |
|---|---|
| `table-order/src/hooks/useSession.ts` | 세션 관리 (로그인/검증/로그아웃) |
| `table-order/src/hooks/useCart.ts` | 장바구니 상태 관리 (localStorage 연동) |
| `table-order/src/hooks/useSSE.ts` | SSE 실시간 이벤트 연결 |

### 컴포넌트 (11개)
| 파일 | 설명 |
|---|---|
| `table-order/src/components/customer/CustomerHeader.tsx` | 매장명 + 테이블 번호 헤더 |
| `table-order/src/components/customer/CustomerNav.tsx` | 메뉴/장바구니/주문내역 탭 네비게이션 |
| `table-order/src/components/customer/CategoryBar.tsx` | 카테고리 필터 바 |
| `table-order/src/components/customer/MenuCard.tsx` | 메뉴 카드 (이미지+이름+가격+담기) |
| `table-order/src/components/customer/MenuGrid.tsx` | 메뉴 2열 그리드 |
| `table-order/src/components/customer/CartItem.tsx` | 장바구니 아이템 (수량 조절/삭제) |
| `table-order/src/components/customer/CartSummary.tsx` | 장바구니 합계 + 주문 버튼 |
| `table-order/src/components/customer/OrderConfirmModal.tsx` | 주문 확인 모달 |
| `table-order/src/components/customer/OrderSuccessModal.tsx` | 주문 성공 모달 (5초 카운트다운) |
| `table-order/src/components/customer/OrderCard.tsx` | 주문 내역 카드 (상태 배지) |
| `table-order/src/components/customer/LoginForm.tsx` | 로그인 폼 (매장코드+테이블번호) |

### 페이지 (5개)
| 파일 | 설명 |
|---|---|
| `table-order/src/app/customer/layout.tsx` | 고객 레이아웃 (헤더+네비+세션검증+SSE) |
| `table-order/src/app/customer/page.tsx` | 메뉴 페이지 (카테고리 필터+메뉴 그리드) |
| `table-order/src/app/customer/cart/page.tsx` | 장바구니 페이지 (주문 생성 플로우) |
| `table-order/src/app/customer/orders/page.tsx` | 주문 내역 페이지 (SSE 실시간 갱신) |
| `table-order/src/app/customer/login/page.tsx` | 로그인 페이지 |

## 의존성
- Unit 1 (미구현): `@/lib/auth`, `@/lib/sse`, `@/lib/db` — API Route에서 import
- Unit 2 (미구현): `@/lib/order` — 주문 API Route에서 import
- Unit 3 (구현 완료): `@/types/menu`, `@/lib/menu` — 메뉴 타입 참조

## 총 파일 수: 27개
