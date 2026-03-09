# Unit 2: 주문 처리 - 비기능 요구사항 설계 (NFR Design)

## 1. 설계 패턴

### 1.1 에러 처리 패턴

**패턴**: 구조화된 에러 객체 + API 레이어 통합 핸들링

```typescript
// 비즈니스 에러 형식 (모든 모듈 공통)
interface BusinessError {
  code: string;    // 에러 코드 (예: ORDER_NOT_FOUND)
  message: string; // 사용자 메시지 (한국어)
  status: number;  // HTTP 상태 코드
}

// 모듈에서 throw
throw { code: 'ORDER_NOT_FOUND', message: '주문을 찾을 수 없습니다.', status: 404 };

// API Route에서 catch
try {
  const result = await createOrder(tableId, sessionId, items);
  return NextResponse.json(result);
} catch (err) {
  const { code, message, status } = err as BusinessError;
  return NextResponse.json({ error: { code, message } }, { status });
}
```

**설계 결정**:
- 비즈니스 로직 레이어: 에러를 throw (HTTP 상태 코드 포함)
- API 레이어: try-catch로 잡아서 통일된 JSON 응답 반환
- 클라이언트: error.code로 에러 유형 판별

### 1.2 비동기 처리 패턴

**패턴**: async/await + SSE 이벤트 기반 알림

```
[동기 처리]                          [비동기 알림]
고객 → API Route → Order Module      → SSE Module → 관리자/고객
       (await)     (DB 트랜잭션)        (fire-and-forget)
```

**설계 결정**:
- DB 작업: async/await (sql.js 초기화가 비동기)
- SSE 알림: API Route에서 DB 작업 완료 후 동기적으로 호출 (fire-and-forget)
- SSE 전송 실패: 연결 제거만 수행, 재시도 없음 (클라이언트 재연결 의존)

### 1.3 트랜잭션 패턴

**패턴**: sql.js exec()를 활용한 수동 트랜잭션

```typescript
// createOrder에서 사용
const db = await getDb();
// sql.js는 exec()로 여러 SQL을 한번에 실행 가능
// 단, 파라미터 바인딩이 필요하므로 개별 run() 호출
// BEGIN/COMMIT으로 원자성 보장
run('BEGIN TRANSACTION', []);
try {
  run('INSERT INTO "order" ...', [...]);
  for (const item of items) {
    run('INSERT INTO order_item ...', [...]);
  }
  run('COMMIT', []);
} catch (err) {
  run('ROLLBACK', []);
  throw err;
}
```

---

## 2. 논리적 컴포넌트 정의

### 2.1 API 레이어 구조

```
src/app/api/
  +-- customer/
  |   +-- orders/
  |   |   +-- route.ts          # POST (주문 생성), GET (세션별 목록)
  |   |   +-- [orderId]/
  |   |       +-- route.ts      # GET (주문 상세)
  +-- admin/
      +-- orders/
      |   +-- route.ts          # GET (전체 활성 주문)
      |   +-- [id]/
      |       +-- status/
      |       |   +-- route.ts  # PATCH (상태 변경)
      |       +-- route.ts      # DELETE (주문 삭제)
```

**API 레이어 책임**:
- HTTP 요청 파싱 (body, params, headers)
- 인증/권한 검증 (세션 토큰 확인)
- 서비스 레이어 호출
- SSE 알림 오케스트레이션
- 에러 핸들링 및 HTTP 응답 생성

### 2.2 서비스 레이어 구조 (Order Module)

```
src/lib/order/
  +-- index.ts    # Order Module 공개 API (8개 함수 export)
```

**서비스 레이어 책임**:
- 비즈니스 규칙 검증 (VR-ORD-01~03)
- 상태 전이 검증 (STR-ORD-01)
- 데이터 변환 및 계산 (금액, 주문번호)
- 트랜잭션 관리 (createOrder)
- 비즈니스 에러 throw

**서비스 레이어 원칙**:
- SSE Module에 직접 의존하지 않음 (레이어 분리)
- Database Module의 헬퍼 함수만 사용 (queryAll, queryOne, run)
- 순수 비즈니스 로직만 포함

### 2.3 데이터 접근 레이어 구조

```
src/lib/db/
  +-- index.ts    # getDb, queryAll, queryOne, run, exec, saveDb
  +-- schema.ts   # DDL (CREATE TABLE)
  +-- seed.ts     # 초기 데이터
```

**데이터 접근 레이어 책임**:
- DB 연결 관리 (싱글톤)
- SQL 실행 헬퍼 (queryAll, queryOne, run, exec)
- 파일 영속화 (saveDb)
- 스키마/시드 관리

**Order Module → DB 접근 패턴**:
```typescript
import { getDb, queryAll, queryOne, run } from '@/lib/db';

// 조회: queryAll, queryOne
const order = queryOne<Order>('SELECT * FROM "order" WHERE id = ?', [orderId]);

// 변경: run (자동 saveDb 포함)
run('UPDATE "order" SET status = ? WHERE id = ?', [status, orderId]);
```

---

## 3. 데이터 흐름 설계

### 3.1 주문 생성 데이터 흐름

```
Client (POST /api/customer/orders)
  |
  v
API Route (customer/orders/route.ts)
  |-- 1. 세션 토큰 검증 (Auth.validateSession)
  |-- 2. 요청 body 파싱 (items[])
  |
  v
Order Module (createOrder)
  |-- 3. 세션 활성 확인 (DB 조회)
  |-- 4. 메뉴 검증 + 스냅샷 (DB 조회)
  |-- 5. 금액 계산
  |-- 6. 주문번호 생성 (DB 조회)
  |-- 7. 트랜잭션: order + order_item INSERT
  |
  v
API Route (응답 + 알림)
  |-- 8. SSE.notifyNewOrder(order)
  |-- 9. NextResponse.json(orderWithItems, { status: 201 })
```

### 3.2 상태 변경 데이터 흐름

```
Admin Client (PATCH /api/admin/orders/[id]/status)
  |
  v
API Route (admin/orders/[id]/status/route.ts)
  |-- 1. 요청 body 파싱 (status)
  |
  v
Order Module (updateOrderStatus)
  |-- 2. 주문 조회 (DB)
  |-- 3. 상태 전이 검증
  |-- 4. UPDATE order
  |
  v
API Route (응답 + 알림)
  |-- 5. SSE.notifyOrderStatusChange(order)
  |-- 6. NextResponse.json(order)
```

---

## 4. 입력 검증 설계

### 4.1 검증 레이어

| 레이어 | 검증 내용 | 실패 시 |
|---|---|---|
| API Route | 요청 형식 (JSON 파싱, 필수 필드) | 400 Bad Request |
| Order Module | 비즈니스 규칙 (세션, 메뉴, 수량, 상태) | 비즈니스 에러 throw |
| Database | FK 제약, CHECK 제약 | DB 에러 (최후 방어선) |

### 4.2 검증 순서 (createOrder)

1. items 배열 존재 및 비어있지 않은지 확인
2. 세션 존재 및 활성 상태 확인
3. 각 항목의 메뉴 존재 및 판매 가능 확인
4. 각 항목의 수량 범위 확인 (1~99)
5. 금액 계산 및 무결성 확인

**원칙**: 빠른 실패 (Fast Fail) — 첫 번째 검증 실패 시 즉시 에러 반환
