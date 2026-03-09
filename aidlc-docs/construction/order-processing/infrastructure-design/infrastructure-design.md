# Unit 2: 주문 처리 - 인프라 설계

## 1. 현재 프로젝트 상태 (MVP)

### 1.1 로컬 개발 환경

```
+---------------------------+
|   Docker Container        |
|                           |
|   +-------------------+   |
|   |   Next.js App     |   |
|   |   (Node.js 18+)   |   |
|   |                   |   |
|   |   API Routes      |   |
|   |   + React SSR     |   |
|   |   + SSE Server    |   |
|   +--------+----------+   |
|            |               |
|   +--------v----------+   |
|   |   SQLite (sql.js) |   |
|   |   data/*.db       |   |
|   +-------------------+   |
|                           |
|   +-------------------+   |
|   |   File System     |   |
|   |   public/uploads  |   |
|   +-------------------+   |
+---------------------------+
```

### 1.2 현재 기술 스택

| 구성 요소 | 기술 | 설명 |
|---|---|---|
| 컴퓨팅 | Docker 단일 컨테이너 | Next.js standalone 빌드 |
| 데이터베이스 | SQLite (sql.js) | 인프로세스, 파일 기반 |
| 파일 저장 | 로컬 파일 시스템 | public/uploads/ |
| 실시간 통신 | SSE (인메모리) | 서버 재시작 시 연결 초기화 |
| 컨테이너화 | Docker + Docker Compose | 단일 서비스 |

---

## 2. AWS 서비스 매핑 (향후 프로덕션)

### 2.1 컴퓨팅: ECS Fargate 선택

| 옵션 | 적합성 | 선택 근거 |
|---|---|---|
| Lambda | ❌ 부적합 | SSE 장시간 연결 불가 (15분 제한), Cold Start |
| ECS Fargate | ✅ 선택 | SSE 지원, 컨테이너 기반, 서버리스 관리 |
| EC2 | △ 가능 | 관리 부담, 소규모 MVP에 과도 |

**ECS Fargate 선택 근거**:
- SSE 연결 유지 필요 (Lambda 부적합)
- Docker 이미지 그대로 배포 가능
- 서버 관리 불필요 (Fargate)
- 단일 매장 기준 최소 리소스 (0.25 vCPU, 0.5GB)

### 2.2 데이터베이스: RDS (PostgreSQL) 선택

| 옵션 | 적합성 | 선택 근거 |
|---|---|---|
| SQLite (현재) | MVP 전용 | 단일 인스턴스, 파일 기반 |
| RDS PostgreSQL | ✅ 프로덕션 | 관계형 데이터, 트랜잭션, 확장성 |
| DynamoDB | ❌ 부적합 | 관계형 쿼리 다수 (JOIN), 트랜잭션 복잡 |

**마이그레이션 경로**: SQLite → RDS PostgreSQL
- SQL 문법 호환성 높음 (표준 SQL 사용)
- sql.js 헬퍼 → pg/node-postgres로 교체
- 스키마 동일 유지 가능

### 2.3 네트워킹

```
Internet
  |
  v
+------------------+
| ALB              |  (Application Load Balancer)
| - HTTPS 종료     |
| - /api/* 라우팅  |
+--------+---------+
         |
+--------v---------+
| VPC              |
| +---------------+|
| | Public Subnet ||
| | ECS Fargate   ||
| +-------+-------+|
|         |         |
| +-------v-------+|
| | Private Subnet||
| | RDS PostgreSQL||
| +---------------+|
+------------------+
```

| 구성 요소 | AWS 서비스 | 설명 |
|---|---|---|
| 로드밸런서 | ALB | HTTPS 종료, SSE 지원 (idle timeout 연장) |
| DNS | Route 53 | 도메인 관리 |
| 인증서 | ACM | SSL/TLS 인증서 |
| VPC | VPC | 네트워크 격리 |
| 서브넷 | Public + Private | ECS(Public), RDS(Private) |
| 보안그룹 | SG | ALB→ECS(3000), ECS→RDS(5432) |

---

## 3. 배포 아키텍처

### 3.1 배포 전략: Rolling Update

| 전략 | 적합성 | 선택 근거 |
|---|---|---|
| Rolling Update | ✅ 선택 | 단순, 리소스 효율적, MVP 적합 |
| Blue/Green | △ 향후 | 무중단 배포, 비용 2배 |
| Canary | ❌ 과도 | 소규모 MVP에 불필요 |

**Rolling Update 설정**:
- Minimum healthy: 100% (최소 1개 태스크 유지)
- Maximum: 200% (새 태스크 먼저 시작 후 기존 종료)
- Health check grace period: 30초
- Deregistration delay: 30초

**주의사항**: SSE 연결은 배포 시 끊어짐 → 클라이언트 자동 재연결 구현 필요

### 3.2 CI/CD 파이프라인

```
GitHub Push (feat/unit2)
  |
  v
GitHub Actions
  |
  +-- 1. Lint & Type Check
  |     npm run lint
  |     npx tsc --noEmit
  |
  +-- 2. Build
  |     docker build -t table-order .
  |
  +-- 3. Push to ECR
  |     aws ecr push
  |
  +-- 4. Deploy to ECS
        aws ecs update-service --force-new-deployment
```

| 단계 | 도구 | 설명 |
|---|---|---|
| 소스 관리 | GitHub | 브랜치 전략: main, feat/* |
| CI | GitHub Actions | Lint, Type Check, Build |
| 컨테이너 레지스트리 | ECR | Docker 이미지 저장 |
| 배포 | ECS Service Update | Rolling Update |
| 인프라 관리 | CloudFormation / CDK | IaC (향후) |

### 3.3 환경 구성

| 환경 | 컴퓨팅 | DB | 용도 |
|---|---|---|---|
| Local | Docker Compose | SQLite | 개발 |
| Staging | ECS Fargate (0.25 vCPU) | RDS t3.micro | 테스트 |
| Production | ECS Fargate (0.5 vCPU) | RDS t3.small | 운영 |

---

## 4. MVP 현재 인프라 (Docker Compose)

### 4.1 docker-compose.yml (기존)

```yaml
services:
  app:
    build: ./table-order
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data        # SQLite DB 영속화
      - ./uploads:/app/public/uploads  # 이미지 영속화
    environment:
      - NODE_ENV=production
```

### 4.2 Unit 2 인프라 영향

Unit 2 (Order Module)는 추가 인프라 변경이 필요하지 않습니다:
- 기존 SQLite DB에 order/order_item 테이블 이미 정의됨 (Unit 1 스키마)
- 기존 SSE 인프라 활용 (Unit 1)
- 추가 포트/볼륨/서비스 불필요

---

## 5. 모니터링 (향후)

| 항목 | 도구 | 지표 |
|---|---|---|
| 애플리케이션 로그 | CloudWatch Logs | API 요청/에러 로그 |
| 성능 메트릭 | CloudWatch Metrics | 응답 시간, 에러율 |
| DB 모니터링 | RDS Performance Insights | 쿼리 성능, 연결 수 |
| 알림 | CloudWatch Alarms + SNS | 에러율 > 5%, 응답 > 1초 |
| 대시보드 | CloudWatch Dashboard | 실시간 운영 현황 |
