# Performance Test Instructions

## 목적

소규모 MVP 환경(1매장, 10테이블)에서 성능 요구사항을 충족하는지 검증합니다.

## 성능 요구사항 (NFR-01 기준)

| 항목 | 목표 |
|---|---|
| SSE 이벤트 전달 | 2초 이내 |
| API 응답 시간 | 500ms 이내 (p95) |
| 동시 접속 | 10개 테이블 + 관리자 1~2명 |
| 에러율 | 1% 미만 |

## 테스트 환경

- **하드웨어**: 로컬 개발 머신 (최소 4GB RAM)
- **데이터**: 시드 데이터 (카테고리 5개, 메뉴 20개, 테이블 10개)
- **도구**: 수동 테스트 또는 간단한 스크립트

## 테스트 시나리오

### 시나리오 1: API 응답 시간 측정

```bash
# 개발 서버 실행 후
npm run dev

# 메뉴 조회 API 응답 시간 (10회 반복)
for i in {1..10}; do
  curl -o /dev/null -s -w "Time: %{time_total}s\n" \
    -H "Authorization: Bearer {TOKEN}" \
    http://localhost:3000/api/customer/menu
done
```

**기대 결과**: 평균 응답 시간 200ms 이내

### 시나리오 2: 주문 생성 응답 시간

```bash
for i in {1..10}; do
  curl -o /dev/null -s -w "Time: %{time_total}s\n" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer {TOKEN}" \
    -d '{"items":[{"menuItemId":1,"quantity":2}]}' \
    http://localhost:3000/api/customer/orders
done
```

**기대 결과**: 평균 응답 시간 300ms 이내

### 시나리오 3: SSE 이벤트 전달 지연 측정

1. 고객 화면에서 SSE 연결 수립
2. 관리자 화면에서 주문 상태 변경
3. 고객 화면에서 이벤트 수신까지 시간 측정

**기대 결과**: 2초 이내 이벤트 수신

### 시나리오 4: 동시 접속 테스트

```bash
# 10개 테이블 동시 로그인 + 메뉴 조회
for table in {1..10}; do
  curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"storeCode\":\"STORE1\",\"tableNumber\":$table}" \
    http://localhost:3000/api/customer/auth/login &
done
wait
```

**기대 결과**: 모든 요청 성공, 에러 없음

## 성능 최적화 가이드

성능 미달 시 확인 사항:
1. SQLite 인덱스 적용 여부 (tableId, sessionId, categoryId)
2. SSE 연결 관리 (미사용 연결 정리)
3. Next.js 정적 최적화 활용
4. 이미지 파일 크기 최적화 (5MB 제한 준수)

## 참고

소규모 MVP 특성상 대규모 부하 테스트는 불필요합니다. 위 시나리오로 기본 성능을 확인하면 충분합니다.
