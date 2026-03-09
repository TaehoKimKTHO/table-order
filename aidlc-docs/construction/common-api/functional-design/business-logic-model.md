# Unit 1: 공통 API - 비즈니스 로직 모델

## 1. Unit 1 모듈 범위

Unit 1은 Database, Auth, SSE 모듈을 포함합니다. 이 문서는 Unit 1에 속하는 모듈의 비즈니스 로직만 다루며, 전체 시스템의 핵심 비즈니스 플로우도 참조용으로 정의합니다.

---

## 2. Auth Module 비즈니스 로직

### 2.1 테이블 로그인 플로우 (loginTable)

```
입력: storeCode, tableNumber
  |
  v
[1] storeCode로 매장 조회
  |-- 매장 없음 → Error: STORE_NOT_FOUND
  v
[2] store_id + tableNumber로 테이블 조회
  |-- 테이블 없음 → Error: TABLE_NOT_FOUND
  v
[3] 테이블의 활성 세션 확인 (status='active')
  |-- 활성 세션 있음 → 기존 세션 토큰 반환
  |-- 활성 세션 없음 → [4]로 진행
  v
[4] 새 세션 생성
  |-- UUID v4로 session_token 생성
  |-- table_session 레코드 삽입 (status='active')
  |-- restaurant_table.is_occupied = 1 업데이트
  v
[5] 응답 반환
  |-- sessionToken, tableId, tableNumber, storeName
```

**데이터 흐름:**
- 입력: `{ storeCode: string, tableNumber: number }`
- 출력: `{ sessionToken: string, tableId: number, tableNumber: number, storeName: string }`
- DB 조회: store → restaurant_table → table_session
- DB 쓰기: table_session INSERT, restaurant_table UPDATE (조건부)

### 2.2 세션 검증 플로우 (validateSession)

```
입력: sessionToken (HTTP Header 또는 Cookie)
  |
  v
[1] session_token으로 table_session 조회
  |-- 세션 없음 → Error: SESSION_NOT_FOUND
  v
[2] 세션 상태 확인
  |-- status='completed' → Error: SESSION_EXPIRED
  |-- status='active' → [3]으로 진행
  v
[3] 응답 반환
  |-- tableId, sessionId, tableNumber, isValid=true
```

**데이터 흐름:**
- 입력: `{ sessionToken: string }`
- 출력: `{ tableId: number, sessionId: number, tableNumber: number, isValid: boolean }`
- DB 조회: table_session (JOIN restaurant_table)

### 2.3 활성 세션 조회 (getActiveSession)

```
입력: tableId
  |
  v
[1] table_id + status='active'로 table_session 조회
  |-- 없음 → null 반환
  |-- 있음 → TableSession 객체 반환
```

---

## 3. SSE Module 비즈니스 로직

### 3.1 연결 관리 모델

```
SSE 연결 저장소 (인메모리 Map)
  |
  +-- adminConnections: Map<clientId, Response>
  |     (관리자 SSE 연결 목록)
  |
  +-- customerConnections: Map<tableId, Map<clientId, Response>>
        (테이블별 고객 SSE 연결 목록)
```

### 3.2 연결 등록 플로우 (addConnection)

```
입력: clientId, type ('customer' | 'admin'), tableId (customer만), response
  |
  v
[1] type 확인
  |-- 'admin' → adminConnections에 추가
  |-- 'customer' → customerConnections[tableId]에 추가
  v
[2] SSE 헤더 설정
  |-- Content-Type: text/event-stream
  |-- Cache-Control: no-cache
  |-- Connection: keep-alive
  v
[3] 초기 연결 확인 이벤트 전송
  |-- event: connected, data: { clientId, type }
  v
[4] 연결 해제 리스너 등록
  |-- response.on('close') → removeConnection(clientId)
```

### 3.3 이벤트 브로드캐스트 플로우

```
broadcastToAdmin(event, data):
  adminConnections의 모든 연결에 이벤트 전송
  전송 실패 시 해당 연결 제거

broadcastToTable(tableId, event, data):
  customerConnections[tableId]의 모든 연결에 이벤트 전송
  전송 실패 시 해당 연결 제거
```

### 3.4 이벤트 알림 플로우

```
notifyNewOrder(order):
  → broadcastToAdmin('order:new', order)

notifyOrderStatusChange(order):
  → broadcastToTable(order.tableId, 'order:status', { orderId, status })
  → broadcastToAdmin('order:status', { orderId, tableId, status })

notifyOrderDeleted(orderId, tableId):
  → broadcastToTable(tableId, 'order:deleted', { orderId })
  → broadcastToAdmin('order:deleted', { orderId, tableId })
```

### 3.5 SSE 메시지 형식

```
event: {eventType}\n
data: {JSON.stringify(payload)}\n\n
```

예시:
```
event: order:new
data: {"orderId":1,"tableId":2,"orderNumber":"ORD-20260309-0001","totalAmount":15000}

event: order:status
data: {"orderId":1,"status":"preparing"}
```

---

## 4. Database Module 비즈니스 로직

### 4.1 초기화 플로우 (initializeDb)

```
[1] SQLite 데이터베이스 파일 존재 확인
  |-- 없음 → 새 파일 생성
  v
[2] WAL 모드 활성화
  |-- PRAGMA journal_mode=WAL
  v
[3] 외래 키 제약 활성화
  |-- PRAGMA foreign_keys=ON
  v
[4] 스키마 생성 (CREATE TABLE IF NOT EXISTS)
  |-- 7개 테이블 순서대로 생성 (의존성 순서)
  |-- store → restaurant_table → table_session
  |-- store → category → menu_item
  |-- order → order_item
  v
[5] 인덱스 생성 (CREATE INDEX IF NOT EXISTS)
```

### 4.2 시드 데이터 플로우 (seedData)

```
[1] store 테이블 데이터 존재 확인
  |-- 데이터 있음 → 시드 건너뜀 (멱등성)
  |-- 데이터 없음 → [2]로 진행
  v
[2] 트랜잭션 시작
  |-- 매장 데이터 삽입
  |-- 카테고리 데이터 삽입
  |-- 메뉴 데이터 삽입
  |-- 테이블 데이터 삽입 (비밀번호 해싱)
  v
[3] 트랜잭션 커밋
```

### 4.3 데이터베이스 인스턴스 관리 (getDb)

```
[1] 싱글톤 패턴으로 DB 인스턴스 관리
  |-- 인스턴스 없음 → 새 연결 생성 + initializeDb()
  |-- 인스턴스 있음 → 기존 인스턴스 반환
```

---

## 5. 핵심 비즈니스 플로우 (전체 시스템 참조)

Unit 1은 인프라 유닛이지만, 전체 시스템의 핵심 플로우를 이해하기 위해 참조용으로 정의합니다.

### 5.1 고객 주문 플로우 (E2E)

```
[고객 태블릿]                    [서버]                      [관리자 대시보드]
     |                            |                              |
     |-- 자동 로그인 요청 -------->|                              |
     |<-- sessionToken 반환 ------|                              |
     |                            |                              |
     |-- 메뉴 조회 요청 --------->|                              |
     |<-- 메뉴 목록 반환 ---------|                              |
     |                            |                              |
     |-- [장바구니: 로컬 관리] --->|                              |
     |                            |                              |
     |-- 주문 생성 요청 --------->|                              |
     |                            |-- SSE: order:new ----------->|
     |<-- 주문번호 반환 ----------|                              |
     |                            |                              |
     |                            |<-- 상태 변경 요청 -----------|
     |<-- SSE: order:status ------|-- SSE: order:status -------->|
     |                            |                              |
     |                            |<-- 이용 완료 요청 -----------|
     |<-- SSE: table:completed ---|                              |
     |-- [세션 리셋] ------------>|                              |
```

### 5.2 주문 상태 전이 플로우

```
pending (대기중)
  |
  |-- 관리자 상태 변경 -->
  v
preparing (준비중)
  |
  |-- 관리자 상태 변경 -->
  v
completed (완료)
```

### 5.3 테이블 세션 라이프사이클

```
[테이블 비어있음] (is_occupied=0, 활성 세션 없음)
  |
  |-- 고객 로그인 -->
  v
[세션 활성] (is_occupied=1, session.status='active')
  |
  |-- 주문 생성/조회 가능
  |
  |-- 관리자 이용 완료 -->
  v
[세션 종료] (is_occupied=0, session.status='completed', ended_at 설정)
  |
  |-- 주문 이력은 과거 내역으로 보관
  |-- 다음 고객 로그인 시 새 세션 생성
```
