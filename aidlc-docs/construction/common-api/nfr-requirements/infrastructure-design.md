# 테이블오더 서비스 - 인프라 설계

## 1. 배포 아키텍처 개요

### 1.1 MVP 배포 구성 (단일 매장)

```
[인터넷/매장 내부 네트워크]
         |
         v
+------------------+
|   Docker Host    |
|  (매장 서버/PC)   |
|                  |
|  +------------+  |
|  | table-order|  |
|  | container  |  |
|  |            |  |
|  | Next.js    |  |
|  | :3000      |  |
|  +-----+------+  |
|        |         |
|  +-----v------+  |
|  | Volume:     |  |
|  | /data       |  |  ← SQLite DB 파일
|  | /uploads    |  |  ← 메뉴 이미지 파일
|  +------------+  |
+------------------+
```

### 1.2 네트워크 구성

| 구분 | 설정 | 비고 |
|---|---|---|
| 서비스 포트 | 3000 (HTTP) | Docker 포트 매핑: 3000:3000 |
| 접근 범위 | 매장 내부 네트워크 | WiFi/LAN 기반 |
| 고객 접근 | 태블릿 브라우저 | `http://{서버IP}:3000` |
| 관리자 접근 | PC/태블릿 브라우저 | `http://{서버IP}:3000/admin` |

---

## 2. Docker 구성

### 2.1 Dockerfile 설계

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

**설계 결정:**
- Multi-stage 빌드로 이미지 크기 최소화
- Alpine 기반으로 보안 취약점 최소화
- standalone 출력으로 node_modules 의존성 제거

### 2.2 Docker Compose 설계

```yaml
services:
  table-order:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data          # SQLite DB 영속성
      - ./public/uploads:/app/public/uploads  # 이미지 영속성
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

**볼륨 마운트:**
| 호스트 경로 | 컨테이너 경로 | 용도 |
|---|---|---|
| `./data` | `/app/data` | SQLite DB 파일 영속 저장 |
| `./public/uploads` | `/app/public/uploads` | 메뉴 이미지 파일 영속 저장 |

---

## 3. AWS 배포 아키텍처 (확장 시)

### 3.1 AWS 서비스 매핑

단일 매장 MVP에서 다중 매장 SaaS로 확장 시 AWS 서비스 매핑:

| 현재 (MVP) | AWS 서비스 | 역할 |
|---|---|---|
| Docker Host | ECS Fargate 또는 App Runner | 컨테이너 실행 |
| SQLite 파일 | Amazon RDS (PostgreSQL) | 관계형 데이터베이스 |
| 로컬 파일 시스템 | Amazon S3 | 이미지 저장소 |
| 인메모리 SSE Map | Amazon ElastiCache (Redis) | SSE 연결 상태 공유 |
| 없음 | Amazon CloudFront | CDN (정적 자산, 이미지) |
| 없음 | Application Load Balancer | 로드 밸런싱, HTTPS 종단 |
| 없음 | Amazon Route 53 | DNS 관리 |
| 없음 | AWS Certificate Manager | SSL/TLS 인증서 |

### 3.2 AWS 아키텍처 다이어그램 (확장 시)

```
[Route 53] → [CloudFront] → [ALB]
                                |
                    +-----------+-----------+
                    |                       |
              [ECS Fargate]           [ECS Fargate]
              (table-order)           (table-order)
                    |                       |
                    +-----------+-----------+
                                |
                    +-----------+-----------+
                    |           |           |
                [RDS]    [ElastiCache]   [S3]
              (PostgreSQL)  (Redis)    (이미지)
```

### 3.3 확장 시 마이그레이션 포인트

| 컴포넌트 | 변경 사항 | 영향도 |
|---|---|---|
| Database | sql.js → PostgreSQL 드라이버 (pg) | 높음 — 쿼리 호환성 확인 필요 |
| Upload | 로컬 파일 → S3 SDK | 중간 — Upload Module만 변경 |
| SSE | 인메모리 Map → Redis Pub/Sub | 높음 — 다중 인스턴스 지원 |
| Auth | 세션 토큰 → JWT + Cognito | 중간 — Auth Module 교체 |
| Config | 환경 변수 → AWS Systems Manager | 낮음 — 환경 변수 소스만 변경 |

---

## 4. 로컬 개발 환경

### 4.1 개발 환경 구성

```
[개발자 PC]
  |
  +-- Node.js 20 LTS
  +-- npm
  +-- Git
  |
  +-- table-order/
      +-- npm run dev → localhost:3000
      +-- data/table-order.db (자동 생성)
      +-- public/uploads/ (이미지 저장)
```

### 4.2 환경별 설정

| 환경 | DB | 이미지 저장 | SSE | 포트 |
|---|---|---|---|---|
| 개발 (dev) | SQLite 파일 (data/) | 로컬 (public/uploads/) | 인메모리 Map | 3000 |
| 프로덕션 (Docker) | SQLite 파일 (볼륨 마운트) | 볼륨 마운트 | 인메모리 Map | 3000 |
| 프로덕션 (AWS) | RDS PostgreSQL | S3 | Redis Pub/Sub | 3000 |

---

## 5. 모니터링 및 로깅

### 5.1 MVP 모니터링

| 항목 | 방식 | 비고 |
|---|---|---|
| 애플리케이션 로그 | console.log/error | Docker logs로 확인 |
| 헬스 체크 | GET /api/health | DB 연결 상태 확인 |
| 컨테이너 상태 | docker ps | 실행 상태 확인 |
| DB 크기 | 파일 크기 모니터링 | data/table-order.db |

### 5.2 확장 시 모니터링 (AWS)

| 항목 | AWS 서비스 |
|---|---|
| 애플리케이션 로그 | CloudWatch Logs |
| 메트릭 | CloudWatch Metrics |
| 알림 | CloudWatch Alarms + SNS |
| 트레이싱 | AWS X-Ray |

---

## 6. 백업 및 복구

### 6.1 MVP 백업 전략

| 항목 | 방식 | 주기 | 보관 |
|---|---|---|---|
| SQLite DB | 파일 복사 (`cp data/table-order.db backup/`) | 일 1회 | 7일 |
| 이미지 파일 | 디렉토리 복사 (`cp -r public/uploads/ backup/`) | 일 1회 | 7일 |
| 복구 방법 | 백업 파일을 원래 경로에 복원 후 컨테이너 재시작 | - | - |

### 6.2 백업 스크립트 예시

```bash
#!/bin/bash
BACKUP_DIR="./backup/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"
cp data/table-order.db "$BACKUP_DIR/"
cp -r public/uploads/ "$BACKUP_DIR/uploads/"
# 7일 이전 백업 삭제
find ./backup -maxdepth 1 -type d -mtime +7 -exec rm -rf {} +
```

---

## 7. 보안 설계

### 7.1 네트워크 보안

| 항목 | MVP | 확장 시 |
|---|---|---|
| HTTPS | 미적용 (매장 내부망) | ALB + ACM 인증서 |
| 방화벽 | 매장 라우터 설정 | Security Group + NACL |
| 접근 제어 | IP 기반 (매장 내부) | WAF + IP 화이트리스트 |

### 7.2 컨테이너 보안

| 항목 | 적용 |
|---|---|
| 베이스 이미지 | node:20-alpine (최소 이미지) |
| 실행 사용자 | non-root (nextjs 사용자) |
| 읽기 전용 | 데이터/업로드 볼륨 외 읽기 전용 |
| 이미지 스캔 | 빌드 시 취약점 스캔 (확장 시) |