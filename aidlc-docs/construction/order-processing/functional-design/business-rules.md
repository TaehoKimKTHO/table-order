# Unit 2: 주문 처리 - 비즈니스 규칙 정의

## 1. 검증 규칙 (Validation Rules)

### VR-ORD-01: 주문 생성 검증

| 규칙 ID | 필드/조건 | 규칙 | 에러 코드 | HTTP |
|---|---|---|---|---|
| VR-ORD-01-01 | items | 최소 1개 이상 주문 항목 필수 | EMPTY_ORDER | 400 |
| VR-ORD-01-02 | sessionId | 활성 세션(status='active')에서만 주문 가능 | SESSION_NOT_ACTIVE | 400 |
| VR-ORD-01-03 | sessionId | 존재하는 세션이어야 함 | SESSION_NOT_FOUND | 401 |
| VR-ORD-01-04 | session.table_id | 세션의 table_id와 요청 tableId 일치 필수 | SESSION_NOT_ACTIVE | 400 |
| VR-ORD-01-05 | items[].menuItemId | 존재하는 메뉴여야 함 | MENU_NOT_FOUND | 404 |
| VR-ORD-01-06 | items[].menuItemId | 판매 가능(is_available=1) 메뉴만 주문 가능 | MENU_NOT_AVAILABLE | 400 |
| VR-ORD-01-07 | items[].quantity | 1~99 범위 정수 | INVALID_QUANTITY | 400 |

### VR-ORD-02: 주문번호 검증

| 규칙 ID | 필드 | 규칙 | 설명 |
|---|---|---|---|
| VR-ORD-02-01 | order_number | ORD-YYYYMMDD-XXXX 형식 | 자동 생성, 수동 입력 불가 |
| VR-ORD-02-02 | order_number | 전역 고유 (UNIQUE) | 날짜별 순번으로 고유성 보장 |

### VR-ORD-03: 금액 검증

| 규칙 ID | 필드 | 규칙 | 에러 코드 |
|---|---|---|---|
| VR-ORD-03-01 | subtotal | quantity × unit_price와 일치 | AMOUNT_MISMATCH |
| VR-ORD-03-02 | total_amount | 모든 항목 subtotal의 합과 일치 | AMOUNT_MISMATCH |
| VR-ORD-03-03 | total_amount | 0보다 커야 함 (항목이 있으므로) | EMPTY_ORDER |

---

## 2. 상태 전이 규칙 (State Transition Rules)

### STR-ORD-01: 주문 상태 전이

```
pending (대기중) ──→ preparing (준비중) ──→ completed (완료)
```

| 규칙 ID | 현재 상태 | 요청 상태 | 결과 | 에러 코드 |
|---|---|---|---|---|
| STR-ORD-01-01 | pending | preparing | ✅ 허용 | - |
| STR-ORD-01-02 | preparing | completed | ✅ 허용 | - |
| STR-ORD-01-03 | pending | completed | ❌ 거부 (건너뛰기 금지) | INVALID_STATUS_TRANSITION |
| STR-ORD-01-04 | preparing | pending | ❌ 거부 (역방향 금지) | INVALID_STATUS_TRANSITION |
| STR-ORD-01-05 | completed | preparing | ❌ 거부 (완료 후 변경 금지) | ORDER_ALREADY_COMPLETED |
| STR-ORD-01-06 | completed | pending | ❌ 거부 (완료 후 변경 금지) | ORDER_ALREADY_COMPLETED |

**허용 전이 맵 (코드 구현용):**

```typescript
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['preparing'],
  preparing: ['completed'],
  completed: [],
};
```

**상태 전이 시 부수 효과 (API Layer에서 처리):**

| 전이 | 부수 효과 |
|---|---|
| pending → preparing | SSE: order:status 이벤트 → 고객 + 관리자 |
| preparing → completed | SSE: order:status 이벤트 → 고객 + 관리자 |

---

## 3. 권한 규칙 (Authorization Rules)

### AR-ORD-01: 주문 생성 권한

| 규칙 ID | 행위자 | 행위 | 조건 | 허용 |
|---|---|---|---|---|
| AR-ORD-01-01 | 고객 | 주문 생성 | 유효한 활성 세션 보유 | ✅ |
| AR-ORD-01-02 | 고객 | 주문 생성 | 자신의 테이블 세션에서만 | ✅ |
| AR-ORD-01-03 | 관리자 | 주문 생성 | - | ❌ (관리자는 주문 생성 불가) |

### AR-ORD-02: 주문 조회 권한

| 규칙 ID | 행위자 | 행위 | 조건 | 허용 |
|---|---|---|---|---|
| AR-ORD-02-01 | 고객 | 자신의 세션 주문 조회 | 유효한 세션 토큰 | ✅ |
| AR-ORD-02-02 | 고객 | 다른 세션 주문 조회 | - | ❌ |
| AR-ORD-02-03 | 관리자 | 전체 활성 주문 조회 | 관리자 접근 | ✅ |
| AR-ORD-02-04 | 관리자 | 테이블별 주문 조회 | 관리자 접근 | ✅ |

### AR-ORD-03: 주문 상태 변경 권한

| 규칙 ID | 행위자 | 행위 | 조건 | 허용 |
|---|---|---|---|---|
| AR-ORD-03-01 | 관리자 | 주문 상태 변경 | 관리자 접근 | ✅ |
| AR-ORD-03-02 | 고객 | 주문 상태 변경 | - | ❌ (UNAUTHORIZED_STATUS_CHANGE) |

### AR-ORD-04: 주문 삭제 권한

| 규칙 ID | 행위자 | 행위 | 조건 | 허용 |
|---|---|---|---|---|
| AR-ORD-04-01 | 관리자 | 주문 삭제 | 관리자 접근 | ✅ |
| AR-ORD-04-02 | 고객 | 주문 삭제 | - | ❌ |

**참고**: MVP에서 관리자 인증은 별도 구현하지 않습니다. /api/admin/ 경로 접근 = 관리자 권한으로 간주합니다.

---

## 4. 데이터 무결성 규칙 (Data Integrity Rules)

### DIR-ORD-01: 참조 무결성

| 규칙 ID | 규칙 | 설명 |
|---|---|---|
| DIR-ORD-01-01 | 주문 삭제 시 주문 항목 CASCADE 삭제 | order DELETE → order_item 자동 삭제 |
| DIR-ORD-01-02 | 존재하지 않는 세션으로 주문 생성 불가 | FK 제약 + 비즈니스 로직 검증 |
| DIR-ORD-01-03 | 존재하지 않는 메뉴로 주문 항목 생성 불가 | FK 제약 + 비즈니스 로직 검증 |

### DIR-ORD-02: 스냅샷 무결성

| 규칙 ID | 규칙 | 설명 |
|---|---|---|
| DIR-ORD-02-01 | order_item.menu_name은 주문 시점 값 | 메뉴명 변경 시 기존 주문 영향 없음 |
| DIR-ORD-02-02 | order_item.unit_price는 주문 시점 값 | 가격 변경 시 기존 주문 영향 없음 |
| DIR-ORD-02-03 | order.total_amount = SUM(order_item.subtotal) | 계산 무결성 보장 |
| DIR-ORD-02-04 | order_item.subtotal = quantity × unit_price | 항목별 계산 무결성 |

### DIR-ORD-03: 동시성 규칙

| 규칙 ID | 규칙 | 설명 |
|---|---|---|
| DIR-ORD-03-01 | 주문번호 고유성 | ORD-YYYYMMDD-XXXX, 날짜별 순번 자동 증가 |
| DIR-ORD-03-02 | 주문 생성 트랜잭션 | order + order_item INSERT 원자성 보장 |
| DIR-ORD-03-03 | 상태 변경 원자성 | 단일 UPDATE로 원자성 보장 |

---

## 5. 삭제 규칙 (Deletion Rules)

### DEL-ORD-01: 주문 삭제

| 규칙 ID | 규칙 | 설명 |
|---|---|---|
| DEL-ORD-01-01 | 모든 상태의 주문 삭제 가능 | pending, preparing, completed 모두 삭제 가능 |
| DEL-ORD-01-02 | 관리자만 삭제 가능 | 고객은 주문 삭제 불가 |
| DEL-ORD-01-03 | 삭제 시 SSE 알림 필수 | API Layer에서 SSE.notifyOrderDeleted() 호출 |
| DEL-ORD-01-04 | 삭제 전 tableId 보존 | SSE 알림에 tableId 필요 |

---

## 6. 에러 코드 정의 (Unit 2 관련)

| 에러 코드 | HTTP 상태 | 발생 메서드 | 설명 |
|---|---|---|---|
| SESSION_NOT_FOUND | 401 | createOrder | 세션을 찾을 수 없음 |
| SESSION_NOT_ACTIVE | 400 | createOrder | 활성 세션이 아님 |
| EMPTY_ORDER | 400 | createOrder | 빈 주문 (항목 없음) |
| MENU_NOT_FOUND | 404 | createOrder | 메뉴를 찾을 수 없음 |
| MENU_NOT_AVAILABLE | 400 | createOrder | 판매 중지된 메뉴 |
| INVALID_QUANTITY | 400 | createOrder | 유효하지 않은 수량 (1~99 범위 초과) |
| AMOUNT_MISMATCH | 400 | createOrder | 금액 불일치 |
| ORDER_NOT_FOUND | 404 | getOrder, updateOrderStatus, deleteOrder | 주문을 찾을 수 없음 |
| ORDER_ALREADY_COMPLETED | 400 | updateOrderStatus | 이미 완료된 주문 |
| INVALID_STATUS_TRANSITION | 400 | updateOrderStatus | 유효하지 않은 상태 전이 |
| UNAUTHORIZED_STATUS_CHANGE | 403 | (API Layer) | 상태 변경 권한 없음 (고객 시도 시) |

### 에러 응답 형식 (Unit 1과 동일)

```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "주문을 찾을 수 없습니다."
  }
}
```

---

## 7. Unit 1 비즈니스 규칙과의 관계

Unit 2의 비즈니스 규칙은 Unit 1에서 정의한 전체 시스템 규칙의 **주문 관련 부분을 상세화**한 것입니다.

| Unit 1 규칙 | Unit 2 상세화 | 설명 |
|---|---|---|
| VR-06 (주문 검증) | VR-ORD-01 | 주문 생성 검증 규칙 상세화 |
| STR-01 (주문 상태) | STR-ORD-01 | 상태 전이 규칙 + 코드 구현 가이드 |
| AR-01-02, AR-01-05, AR-01-06 | AR-ORD-01~04 | 고객/관리자 권한 규칙 상세화 |
| DIR-01-02, DIR-02 | DIR-ORD-01~03 | 참조/스냅샷/동시성 무결성 상세화 |
