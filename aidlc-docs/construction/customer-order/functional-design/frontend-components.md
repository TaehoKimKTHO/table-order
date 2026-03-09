# Unit 4: 고객 주문 - 프론트엔드 컴포넌트 설계

## 1. 페이지 구조 및 라우팅

```
table-order/src/app/customer/
  +-- layout.tsx              # 고객 레이아웃 (헤더, 탭 네비게이션)
  +-- page.tsx                # 메뉴 페이지 (기본 화면)
  +-- cart/
  |   +-- page.tsx            # 장바구니 페이지
  +-- orders/
  |   +-- page.tsx            # 주문 내역 페이지
  +-- login/
      +-- page.tsx            # 초기 설정/로그인 페이지
```

### 라우팅 규칙
- `/customer` → 메뉴 조회 (기본 화면)
- `/customer/cart` → 장바구니
- `/customer/orders` → 주문 내역
- `/customer/login` → 초기 로그인 (세션 없을 때만)

### 인증 플로우
1. 모든 페이지 접근 시 localStorage에서 sessionToken 확인
2. 없으면 → `/customer/login`으로 리다이렉트
3. 있으면 → GET /api/customer/auth/validate로 검증
4. 무효 → localStorage 클리어 후 `/customer/login`으로 리다이렉트
5. 유효 → 페이지 렌더링

---

## 2. 컴포넌트 계층 구조

```
CustomerLayout
  +-- CustomerHeader (매장명, 테이블 번호)
  +-- CustomerNav (메뉴/장바구니/주문내역 탭)
  |
  +-- [페이지별 컴포넌트]
      +-- MenuPage
      |   +-- CategoryBar (카테고리 필터)
      |   +-- MenuGrid
      |       +-- MenuCard (개별 메뉴 카드)
      |
      +-- CartPage
      |   +-- CartItemList
      |   |   +-- CartItem (수량 조절, 삭제)
      |   +-- CartSummary (총 금액, 주문 버튼)
      |   +-- OrderConfirmModal (주문 확인 팝업)
      |   +-- OrderSuccessModal (주문 성공 팝업)
      |
      +-- OrdersPage
      |   +-- OrderList
      |       +-- OrderCard (주문 상세, 상태 표시)
      |
      +-- LoginPage
          +-- LoginForm (매장코드, 테이블번호 입력)
```

---

## 3. 컴포넌트 상세 설계

### 3.1 CustomerLayout

**파일**: `table-order/src/app/customer/layout.tsx`

**역할**: 고객 화면 공통 레이아웃

**Props**: children

**상태**: 
- sessionInfo: { tableId, tableNumber, storeName, sessionToken } | null

**동작**:
- 마운트 시 세션 검증
- 세션 무효 시 로그인 페이지로 리다이렉트
- SSE 연결 설정 (전역)

### 3.2 CustomerHeader

**파일**: `table-order/src/components/customer/CustomerHeader.tsx`

**Props**:
- storeName: string
- tableNumber: number

**UI**: 매장명 + 테이블 번호 배지 (mock-preview 참조: 오렌지 그라데이션 헤더)

### 3.3 CustomerNav

**파일**: `table-order/src/components/customer/CustomerNav.tsx`

**Props**:
- cartItemCount: number (장바구니 아이템 수)

**UI**: 3개 탭 (🍴 메뉴, 🛒 장바구니 {count}, 📋 주문내역)
- 활성 탭 하단 오렌지 바 표시
- data-testid: `customer-nav-menu`, `customer-nav-cart`, `customer-nav-orders`

### 3.4 CategoryBar

**파일**: `table-order/src/components/customer/CategoryBar.tsx`

**Props**:
- categories: Category[]
- selectedCategoryId: number | null (null = 전체)
- onSelect: (categoryId: number | null) => void

**UI**: 가로 스크롤 카테고리 버튼 목록
- "전체" 버튼 + 카테고리별 버튼
- 활성 카테고리: 오렌지 배경
- data-testid: `category-bar`, `category-btn-{id}`

### 3.5 MenuCard

**파일**: `table-order/src/components/customer/MenuCard.tsx`

**Props**:
- menuItem: MenuItem
- onAddToCart: (menuItem: MenuItem) => void

**UI**: 카드 레이아웃 (이미지 + 이름 + 설명 + 가격 + 담기 버튼)
- 이미지: 100px 높이, 없으면 기본 이모지/색상
- 담기 버튼: 최소 44x44px 터치 타겟
- data-testid: `menu-card-{id}`, `menu-add-btn-{id}`

### 3.6 CartItem

**파일**: `table-order/src/components/customer/CartItem.tsx`

**Props**:
- item: CartItemData (menuItem + quantity)
- onUpdateQuantity: (menuItemId: number, quantity: number) => void
- onRemove: (menuItemId: number) => void

**UI**: 메뉴명 + 단가 + 수량 조절(−/+) + 소계 + 삭제(✕)
- 수량 버튼: 최소 32x32px
- data-testid: `cart-item-{id}`, `cart-qty-minus-{id}`, `cart-qty-plus-{id}`, `cart-remove-{id}`

### 3.7 CartSummary

**파일**: `table-order/src/components/customer/CartSummary.tsx`

**Props**:
- totalAmount: number
- itemCount: number
- onOrder: () => void
- onClear: () => void

**UI**: 총 금액 표시 + 주문하기 버튼 + 장바구니 비우기 버튼
- 주문하기: 오렌지 배경, 56px 높이, 전체 너비
- data-testid: `cart-total`, `cart-order-btn`, `cart-clear-btn`

### 3.8 OrderConfirmModal

**파일**: `table-order/src/components/customer/OrderConfirmModal.tsx`

**Props**:
- isOpen: boolean
- items: CartItemData[]
- totalAmount: number
- onConfirm: () => void
- onCancel: () => void

**UI**: 오버레이 + 모달 (주문 항목 목록 + 합계 + 취소/확정 버튼)
- data-testid: `order-confirm-modal`, `order-confirm-btn`, `order-cancel-btn`

### 3.9 OrderSuccessModal

**파일**: `table-order/src/components/customer/OrderSuccessModal.tsx`

**Props**:
- isOpen: boolean
- orderNumber: string

**UI**: 성공 아이콘 + 주문번호 + "5초 후 메뉴 화면으로 이동" + 카운트다운 바
- 5초 후 자동으로 메뉴 페이지로 리다이렉트
- data-testid: `order-success-modal`, `order-number-display`

### 3.10 OrderCard

**파일**: `table-order/src/components/customer/OrderCard.tsx`

**Props**:
- order: Order (with items)

**UI**: 주문번호 + 상태 배지 + 시각 + 메뉴 목록 + 합계
- 상태 배지 색상: 대기중(주황), 준비중(파랑), 완료(초록)
- data-testid: `order-card-{id}`, `order-status-{id}`

### 3.11 LoginForm

**파일**: `table-order/src/components/customer/LoginForm.tsx`

**Props**:
- onLogin: (storeCode: string, tableNumber: number) => void

**UI**: 매장코드 입력 + 테이블번호 입력 + 로그인 버튼
- 초기 설정용 (1회만 사용, 이후 자동 로그인)
- data-testid: `login-store-code`, `login-table-number`, `login-submit-btn`

---

## 4. 상태 관리

### 4.1 장바구니 상태 (useCart hook)

```typescript
interface CartItemData {
  menuItem: MenuItem;
  quantity: number;
}

interface CartState {
  items: CartItemData[];
  totalAmount: number;
  itemCount: number;
}

// 액션
addItem(menuItem: MenuItem): void
removeItem(menuItemId: number): void
updateQuantity(menuItemId: number, quantity: number): void
clearCart(): void
```

**저장**: localStorage `cart_{tableId}`
**복원**: 페이지 로드 시 localStorage에서 복원

### 4.2 세션 상태 (useSession hook)

```typescript
interface SessionState {
  sessionToken: string | null;
  tableId: number | null;
  sessionId: number | null;
  tableNumber: number | null;
  storeName: string | null;
  isAuthenticated: boolean;
}

// 액션
login(storeCode: string, tableNumber: number): Promise<void>
validate(): Promise<boolean>
logout(): void  // 세션 종료 시
```

**저장**: localStorage `session_info`

### 4.3 SSE 상태 (useSSE hook)

```typescript
interface SSEState {
  isConnected: boolean;
  lastEvent: SSEEvent | null;
}

// 수신 이벤트
onOrderStatusChange(orderId: number, status: string): void
onOrderDeleted(orderId: number): void
onTableCompleted(): void  // 세션 종료 → 장바구니 클리어 + 로그인 페이지
```

---

## 5. API 통합 포인트

| 컴포넌트 | API 호출 | 설명 |
|---|---|---|
| LoginForm | POST /api/customer/auth/login | 로그인 |
| CustomerLayout | GET /api/customer/auth/validate | 세션 검증 |
| MenuPage | GET /api/customer/menu | 전체 메뉴 조회 |
| MenuPage | GET /api/customer/menu/[categoryId] | 카테고리별 조회 |
| CartPage | POST /api/customer/orders | 주문 생성 |
| OrdersPage | GET /api/customer/orders | 주문 목록 조회 |
| CustomerLayout | GET /api/customer/sse | SSE 연결 |

---

## 6. UI 디자인 참조 (mock-preview 기반)

| 요소 | 스타일 |
|---|---|
| 헤더 | 오렌지 그라데이션 (#ff6b35 → #f7931e) |
| 메뉴 카드 | 2열 그리드, 12px 간격, 둥근 모서리 12px |
| 담기 버튼 | 오렌지 배경, 최소 44x44px |
| 장바구니 수량 | 원형 버튼 (−/+), 32x32px |
| 주문 버튼 | 전체 너비, 56px 높이, 오렌지 |
| 상태 배지 | 대기중(#fff3e0/#e65100), 준비중(#e3f2fd/#1565c0), 완료(#e8f5e9/#2e7d32) |
| 모달 | 반투명 오버레이, 둥근 모서리 16px |
