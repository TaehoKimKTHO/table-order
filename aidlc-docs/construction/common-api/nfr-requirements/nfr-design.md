# 테이블오더 서비스 - 비기능 설계 (NFR Design)

## 1. 아키텍처 패턴

### 1.1 전체 아키텍처

```
[고객 태블릿]     [관리자 PC/태블릿]
     |                    |
     v                    v
+------------------------------------+
|        Next.js App Router          |
|  (React 19 + API Routes + SSE)     |
+------------------------------------+
|         비즈니스 로직 레이어          |
|  Auth | Menu | Order | Table | SSE  |
+------------------------------------+
|         데이터 접근 레이어            |
|     sql.js (SQLite in-process)      |
+------------------------------------+
|         파일 시스템                   |
|   SQLite DB 파일 | 이미지 파일        |
+------------------------------------+
```

### 1.2 레이어 구조

| 레이어 | 역할 | 위치 |
|---|---|---|
| Presentation | React UI 컴포넌트, 페이지 | `src/app/`, `src/components/` |
| API Routes | HTTP 요청 처리, 입력 검증, 응답 포맷팅 | `src/app/api/` |
| Business Logic | 비즈니스 규칙, 상태 전이, 데이터 변환 | `src/lib/` |
| Data Access | SQL 쿼리, DB 연결 관리 | `src/lib/db/` |

**레이어 간 의존성 규칙:**
- 상위 레이어만 하위 레이어를 참조 (단방향)
- API Routes → Business Logic → Data Access
- UI → API Routes (HTTP 호출)
- 동일 레이어 간 직접 참조 금지 (SSE Module 제외 — 인프라 성격)

---

## 2. 설계 패턴

### 2.1 싱글톤 패턴 (Database)

```typescript
// 패턴: 모듈 레벨 싱글톤
let db: SqlJsDatabase | null = null;
let initPromise: Promise<SqlJsDatabase> | null = null;

export async function getDb(): Promise<SqlJsDatabase> {
  if (db) return db;
  if (initPromise) return initPromise;
  initPromise = initializeAndReturn();
  return initPromise;
}
```

**적용 이유:**
- sql.js는 인메모리 DB를 파일로 동기화하므로 단일 인스턴스 필수
- 초기화 비용 절감 (WASM 로딩 1회)
- 동시 초기화 방지 (Promise 캐싱)

### 2.2 옵저버 패턴 (SSE)

```typescript
// 패턴: 이벤트 기반 브로드캐스트
const adminConnections = new Map<string, WritableStreamDefaultWriter>();
const customerConnections = new Map<number, Map<string, WritableStreamDefaultWriter>>();

function broadcastToAdmin(event: string, data: object): void {
  adminConnections.forEach((writer, clientId) => {
    try { sendEvent(writer, event, data); }
    catch { removeConnection(clientId); }
  });
}
```

**적용 이유:**
- 주문 상태 변경 시 다수 클라이언트에 동시 알림 필요
- 연결 실패 시 자동 정리 (fail-safe)
- 관리자/고객 채널 분리로 불필요한 이벤트 전송 방지

### 2.3 리포지토리 패턴 (Data Access)

```typescript
// 패턴: 헬퍼 함수 기반 데이터 접근
export function queryAll<T>(sql: string, params: unknown[]): T[]
export function queryOne<T>(sql: string, params: unknown[]): T | undefined
export function run(sql: string, params: unknown[]): void
```

**적용 이유:**
- SQL 쿼리 실행의 일관된 인터페이스 제공
- Prepared Statement 자동 적용 (SQL Injection 방지)
- 쿼리 결과의 타입 안전한 변환

---

## 3. 에러 처리 설계

### 3.1 에러 응답 구조

```typescript
// 표준 에러 응답 형식
interface ApiErrorResponse {
  error: {
    code: string;    // 에러 코드 (예: STORE_NOT_FOUND)
    message: string; // 사용자 친화적 메시지
  };
}

// API Route 에러 처리 패턴
function handleError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.httpStatus }
    );
  }
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
    { status: 500 }
  );
}
```

### 3.2 에러 분류

| 분류 | HTTP 상태 | 처리 방식 | 예시 |
|---|---|---|---|
| 입력 검증 오류 | 400 | 즉시 반환, 필드별 메시지 | INVALID_PRICE, EMPTY_ORDER |
| 인증 오류 | 401 | 세션 토큰 재발급 유도 | SESSION_NOT_FOUND |
| 권한 오류 | 403 | 접근 거부 메시지 | UNAUTHORIZED_STATUS_CHANGE |
| 리소스 없음 | 404 | 대상 명시 | ORDER_NOT_FOUND |
| 충돌 | 409 | 현재 상태 안내 | ACTIVE_SESSION_EXISTS |
| 서버 오류 | 500 | 일반 메시지, 로그 기록 | DB 연결 실패 등 |

---

## 4. SSE 연결 관리 설계

### 4.1 연결 라이프사이클

```
[클라이언트 연결 요청]
  |
  v
[SSE 헤더 설정] → Content-Type: text/event-stream
  |
  v
[연결 등록] → Map에 clientId + writer 저장
  |
  v
[초기 이벤트 전송] → event: connected
  |
  v
[이벤트 수신 대기] ←→ [비즈니스 이벤트 발생 시 전송]
  |
  v
[연결 종료 감지] → Map에서 제거
```

### 4.2 연결 안정성

| 항목 | 설계 | 비고 |
|---|---|---|
| 연결 끊김 감지 | WritableStream close 이벤트 | 자동 정리 |
| 클라이언트 재연결 | EventSource 기본 동작 (자동) | 브라우저 내장 |
| 하트비트 | 30초 간격 ping 이벤트 | 연결 유지 확인 |
| 최대 연결 수 | 12개 (고객 10 + 관리자 2) | 소규모 매장 기준 |

---

## 5. 데이터베이스 설계 패턴

### 5.1 파일 기반 영속성

```
[sql.js 인메모리 DB]
  |
  |-- 쓰기 작업 발생 시 →
  v
[파일 시스템 동기화]
  |-- data/table-order.db 파일에 export
  |-- 동기적 쓰기 (데이터 손실 방지)
```

### 5.2 트랜잭션 패턴

```typescript
// 복합 작업 시 트랜잭션 사용
function executeInTransaction(operations: () => void): void {
  db.run('BEGIN TRANSACTION');
  try {
    operations();
    db.run('COMMIT');
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  }
}
```

**트랜잭션 적용 대상:**
- 주문 생성 (order + order_items 동시 삽입)
- 이용 완료 처리 (세션 종료 + 테이블 상태 변경)
- 카테고리 삭제 (CASCADE 삭제 확인)
- 시드 데이터 삽입

---

## 6. API 설계 패턴

### 6.1 RESTful 규칙

| 규칙 | 적용 |
|---|---|
| 리소스 명명 | 복수형 명사 (`/orders`, `/tables`, `/categories`) |
| HTTP 메서드 | GET(조회), POST(생성), PUT(전체수정), PATCH(부분수정), DELETE(삭제) |
| 상태 코드 | 200(성공), 201(생성), 400(입력오류), 401(인증), 404(없음), 500(서버) |
| 응답 형식 | JSON (Content-Type: application/json) |

### 6.2 API Route 구조 (Next.js App Router)

```
src/app/api/
+-- customer/
|   +-- auth/login/route.ts      # POST — 로그인
|   +-- auth/validate/route.ts   # GET — 세션 검증
|   +-- menu/route.ts            # GET — 전체 메뉴
|   +-- menu/[categoryId]/route.ts # GET — 카테고리별 메뉴
|   +-- orders/route.ts          # GET, POST — 주문 목록/생성
|   +-- orders/[orderId]/route.ts # GET — 주문 상세
|   +-- sse/route.ts             # GET — SSE 연결
+-- admin/
|   +-- orders/route.ts          # GET — 전체 활성 주문
|   +-- orders/[orderId]/status/route.ts # PATCH — 상태 변경
|   +-- orders/[orderId]/route.ts # DELETE — 주문 삭제
|   +-- tables/route.ts          # GET, POST — 테이블 목록/등록
|   +-- tables/[tableId]/route.ts # PUT — 테이블 수정
|   +-- tables/[tableId]/complete/route.ts # POST — 이용 완료
|   +-- tables/[tableId]/history/route.ts # GET — 과거 내역
|   +-- menu/categories/route.ts # GET, POST — 카테고리
|   +-- menu/categories/[id]/route.ts # PUT, DELETE — 카테고리
|   +-- menu/items/route.ts      # GET, POST — 메뉴
|   +-- menu/items/[id]/route.ts # PUT, DELETE — 메뉴
|   +-- menu/items/[id]/order/route.ts # PATCH — 순서 변경
|   +-- sse/route.ts             # GET — SSE 연결
```

---

## 7. 이미지 업로드 설계

### 7.1 업로드 플로우

```
[클라이언트] → multipart/form-data →
[API Route] → 파일 검증 (형식, 크기) →
[Upload Module] → 파일명 생성 (UUID + 확장자) →
[파일 시스템] → public/uploads/{filename} 저장 →
[DB] → menu_item.image_path 업데이트
```

### 7.2 파일 관리 규칙

| 항목 | 규칙 |
|---|---|
| 저장 경로 | `public/uploads/` |
| 파일명 | `{UUID}.{ext}` (충돌 방지) |
| 허용 형식 | jpg, jpeg, png, webp |
| 최대 크기 | 5MB |
| 메뉴 삭제 시 | 연관 이미지 파일도 삭제 |
| 메뉴 수정 시 | 기존 이미지 삭제 후 새 이미지 저장 |