# Unit 1: 공통 API - 비즈니스 규칙 정의

## 1. 검증 규칙 (Validation Rules)

### VR-01: 매장 (Store)
| 규칙 ID | 필드 | 규칙 | 에러 코드 |
|---|---|---|---|
| VR-01-01 | store_code | 영문 소문자 + 숫자, 4~20자 | INVALID_STORE_CODE |
| VR-01-02 | name | 1~100자, 공백만으로 구성 불가 | INVALID_STORE_NAME |

### VR-02: 테이블 (RestaurantTable)
| 규칙 ID | 필드 | 규칙 | 에러 코드 |
|---|---|---|---|
| VR-02-01 | table_number | 1~99 범위 정수 | INVALID_TABLE_NUMBER |
| VR-02-02 | table_number | 매장 내 고유 | DUPLICATE_TABLE_NUMBER |

### VR-03: 테이블 세션 (TableSession)
| 규칙 ID | 필드 | 규칙 | 에러 코드 |
|---|---|---|---|
| VR-03-01 | session_token | UUID v4 형식 | INVALID_SESSION_TOKEN |
| VR-03-02 | table_id | 테이블당 활성 세션 최대 1개 | ACTIVE_SESSION_EXISTS |

### VR-04: 카테고리 (Category)
| 규칙 ID | 필드 | 규칙 | 에러 코드 |
|---|---|---|---|
| VR-04-01 | name | 1~50자, 공백만으로 구성 불가 | INVALID_CATEGORY_NAME |
| VR-04-02 | name | 매장 내 중복 불가 | DUPLICATE_CATEGORY_NAME |
| VR-04-03 | sort_order | 0 이상 정수 | INVALID_SORT_ORDER |

### VR-05: 메뉴 (MenuItem)
| 규칙 ID | 필드 | 규칙 | 에러 코드 |
|---|---|---|---|
| VR-05-01 | name | 1~100자 | INVALID_MENU_NAME |
| VR-05-02 | price | 100원 이상, 10,000,000원 이하 | INVALID_PRICE |
| VR-05-03 | description | 0~500자 | INVALID_DESCRIPTION |
| VR-05-04 | category_id | 존재하는 카테고리 참조 | CATEGORY_NOT_FOUND |
| VR-05-05 | image | 허용 형식: jpg, jpeg, png, webp | INVALID_IMAGE_FORMAT |
| VR-05-06 | image | 최대 5MB | IMAGE_TOO_LARGE |

### VR-06: 주문 (Order)
| 규칙 ID | 필드 | 규칙 | 에러 코드 |
|---|---|---|---|
| VR-06-01 | items | 최소 1개 이상 주문 항목 | EMPTY_ORDER |
| VR-06-02 | session_id | 활성 세션(status='active')에서만 주문 가능 | SESSION_NOT_ACTIVE |
| VR-06-03 | items[].menu_item_id | 존재하고 판매 가능(is_available=1)한 메뉴만 | MENU_NOT_AVAILABLE |
| VR-06-04 | items[].quantity | 1~99 범위 정수 | INVALID_QUANTITY |
| VR-06-05 | total_amount | 주문 항목 소계의 합과 일치 | AMOUNT_MISMATCH |

---

## 2. 상태 전이 규칙 (State Transition Rules)

### STR-01: 주문 상태 (Order Status)

```
pending ──→ preparing ──→ completed
  (대기중)     (준비중)      (완료)
```

| 규칙 ID | 현재 상태 | 허용 전이 | 조건 | 에러 코드 |
|---|---|---|---|---|
| STR-01-01 | pending | preparing | 관리자만 변경 가능 | UNAUTHORIZED_STATUS_CHANGE |
| STR-01-02 | preparing | completed | 관리자만 변경 가능 | UNAUTHORIZED_STATUS_CHANGE |
| STR-01-03 | pending | completed | 불가 (건너뛰기 금지) | INVALID_STATUS_TRANSITION |
| STR-01-04 | preparing | pending | 불가 (역방향 금지) | INVALID_STATUS_TRANSITION |
| STR-01-05 | completed | * | 불가 (완료 후 변경 금지) | ORDER_ALREADY_COMPLETED |

**상태 전이 시 부수 효과:**
- pending → preparing: SSE로 고객/관리자에게 알림, updated_at 갱신
- preparing → completed: SSE로 고객/관리자에게 알림, updated_at 갱신

### STR-02: 세션 상태 (Session Status)

```
active ──→ completed
(활성)      (종료)
```

| 규칙 ID | 현재 상태 | 허용 전이 | 조건 | 에러 코드 |
|---|---|---|---|---|
| STR-02-01 | active | completed | 관리자 이용 완료 처리 시 | - |
| STR-02-02 | completed | active | 불가 (종료된 세션 재활성화 금지) | SESSION_ALREADY_COMPLETED |

**세션 종료 시 부수 효과:**
- table_session.ended_at 설정
- table_session.status = 'completed'
- restaurant_table.is_occupied = 0
- SSE로 해당 테이블 고객에게 table:completed 이벤트 전송
- SSE로 관리자에게 테이블 상태 업데이트 전송

---

## 3. 권한 규칙 (Authorization Rules)

### AR-01: 고객 (Customer) 권한

| 규칙 ID | 행위 | 조건 | 설명 |
|---|---|---|---|
| AR-01-01 | 메뉴 조회 | 유효한 세션 토큰 필요 | 활성 세션이 있는 테이블만 |
| AR-01-02 | 주문 생성 | 유효한 활성 세션 필요 | 자신의 테이블에서만 |
| AR-01-03 | 주문 조회 | 유효한 세션 토큰 필요 | 자신의 세션 주문만 |
| AR-01-04 | SSE 연결 | 유효한 세션 토큰 필요 | 자신의 테이블 이벤트만 수신 |
| AR-01-05 | 주문 상태 변경 | 불가 | 고객은 상태 변경 권한 없음 |
| AR-01-06 | 주문 삭제 | 불가 | 고객은 삭제 권한 없음 |

### AR-02: 관리자 (Admin) 권한

| 규칙 ID | 행위 | 조건 | 설명 |
|---|---|---|---|
| AR-02-01 | 주문 상태 변경 | 관리자 접근 | 모든 테이블 주문 상태 변경 가능 |
| AR-02-02 | 주문 삭제 | 관리자 접근 | 모든 주문 삭제 가능 |
| AR-02-03 | 테이블 관리 | 관리자 접근 | 테이블 CRUD 전체 |
| AR-02-04 | 메뉴 관리 | 관리자 접근 | 메뉴/카테고리 CRUD 전체 |
| AR-02-05 | 이용 완료 처리 | 관리자 접근 | 테이블 세션 종료 |
| AR-02-06 | 과거 내역 조회 | 관리자 접근 | 모든 테이블 과거 주문 조회 |
| AR-02-07 | SSE 연결 | 관리자 접근 | 매장 전체 이벤트 수신 |

### AR-03: 인증 방식

| 대상 | 인증 방식 | 토큰 위치 | 설명 |
|---|---|---|---|
| 고객 | 세션 토큰 | Authorization 헤더 또는 Cookie | loginTable()로 발급 |
| 관리자 | 없음 (MVP) | - | 보안 확장 미적용, /admin 경로 직접 접근 |

**참고**: 보안 확장이 미적용(MVP)이므로 관리자 인증은 별도 구현하지 않습니다. 관리자 API는 /api/admin/ 경로로 직접 접근 가능합니다.

---

## 4. 데이터 무결성 규칙 (Data Integrity Rules)

### DIR-01: 참조 무결성
| 규칙 ID | 규칙 | 설명 |
|---|---|---|
| DIR-01-01 | 카테고리 삭제 시 하위 메뉴 CASCADE 삭제 | category 삭제 → menu_item 삭제 |
| DIR-01-02 | 주문 삭제 시 주문 항목 CASCADE 삭제 | order 삭제 → order_item 삭제 |
| DIR-01-03 | 테이블 삭제 불가 (활성 세션 존재 시) | 활성 세션이 있는 테이블은 삭제 불가 |
| DIR-01-04 | 카테고리 삭제 불가 (주문 참조 존재 시) | 해당 카테고리 메뉴가 주문에 참조되면 삭제 불가 |

### DIR-02: 스냅샷 무결성
| 규칙 ID | 규칙 | 설명 |
|---|---|---|
| DIR-02-01 | 주문 항목의 menu_name은 주문 시점 값 | 메뉴명 변경 시 기존 주문 영향 없음 |
| DIR-02-02 | 주문 항목의 unit_price는 주문 시점 값 | 가격 변경 시 기존 주문 영향 없음 |
| DIR-02-03 | 주문의 total_amount는 항목 소계의 합 | 계산 무결성 보장 |

### DIR-03: 동시성 규칙
| 규칙 ID | 규칙 | 설명 |
|---|---|---|
| DIR-03-01 | 테이블당 활성 세션 최대 1개 | 동시 로그인 시 기존 세션 반환 |
| DIR-03-02 | 주문 번호 고유성 | ORD-YYYYMMDD-XXXX 형식, 날짜별 순번 |
| DIR-03-03 | SQLite WAL 모드 | 읽기/쓰기 동시성 지원 |

---

## 5. 에러 코드 정의

| 에러 코드 | HTTP 상태 | 설명 |
|---|---|---|
| STORE_NOT_FOUND | 404 | 매장을 찾을 수 없음 |
| TABLE_NOT_FOUND | 404 | 테이블을 찾을 수 없음 |
| SESSION_NOT_FOUND | 401 | 세션을 찾을 수 없음 |
| SESSION_EXPIRED | 401 | 세션이 만료됨 (이용 완료 처리됨) |
| SESSION_NOT_ACTIVE | 400 | 활성 세션이 아님 |
| SESSION_ALREADY_COMPLETED | 400 | 이미 종료된 세션 |
| ACTIVE_SESSION_EXISTS | 409 | 이미 활성 세션이 존재함 |
| INVALID_TABLE_NUMBER | 400 | 유효하지 않은 테이블 번호 |
| DUPLICATE_TABLE_NUMBER | 409 | 중복된 테이블 번호 |
| INVALID_CATEGORY_NAME | 400 | 유효하지 않은 카테고리명 |
| DUPLICATE_CATEGORY_NAME | 409 | 중복된 카테고리명 |
| INVALID_MENU_NAME | 400 | 유효하지 않은 메뉴명 |
| INVALID_PRICE | 400 | 유효하지 않은 가격 |
| INVALID_DESCRIPTION | 400 | 유효하지 않은 설명 |
| CATEGORY_NOT_FOUND | 404 | 카테고리를 찾을 수 없음 |
| INVALID_IMAGE_FORMAT | 400 | 허용되지 않은 이미지 형식 |
| IMAGE_TOO_LARGE | 400 | 이미지 크기 초과 |
| MENU_NOT_AVAILABLE | 400 | 판매 중지된 메뉴 |
| EMPTY_ORDER | 400 | 빈 주문 |
| INVALID_QUANTITY | 400 | 유효하지 않은 수량 |
| AMOUNT_MISMATCH | 400 | 금액 불일치 |
| INVALID_STATUS_TRANSITION | 400 | 유효하지 않은 상태 전이 |
| UNAUTHORIZED_STATUS_CHANGE | 403 | 상태 변경 권한 없음 |
| ORDER_ALREADY_COMPLETED | 400 | 이미 완료된 주문 |
| ORDER_NOT_FOUND | 404 | 주문을 찾을 수 없음 |
| MENU_NOT_FOUND | 404 | 메뉴를 찾을 수 없음 |

### 에러 응답 형식

```json
{
  "error": {
    "code": "INVALID_PASSWORD",
    "message": "비밀번호가 일치하지 않습니다."
  }
}
```
