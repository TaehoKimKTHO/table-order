# 테이블오더 서비스 - 요구사항 명확화 질문

제공해주신 요구사항을 분석했습니다. 아래 질문에 답변해주시면 더 정확한 설계와 구현이 가능합니다.
각 질문의 [Answer]: 태그 뒤에 선택지 문자를 입력해주세요.

---

## Question 1
프로젝트의 기술 스택(프로그래밍 언어 및 프레임워크)은 어떻게 하시겠습니까?

A) TypeScript + React (프론트엔드) + Node.js/Express (백엔드)
B) TypeScript + React (프론트엔드) + NestJS (백엔드)
C) TypeScript + Next.js (풀스택)
D) JavaScript + Vue.js (프론트엔드) + Node.js/Express (백엔드)
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 2
데이터베이스는 어떤 것을 사용하시겠습니까?

A) PostgreSQL (관계형 데이터베이스)
B) MySQL (관계형 데이터베이스)
C) MongoDB (NoSQL 문서형 데이터베이스)
D) SQLite (경량 관계형 데이터베이스, 개발/소규모 매장용)
X) Other (please describe after [Answer]: tag below)

[Answer]: D

---

## Question 3
매장(Store)은 단일 매장만 지원하면 되나요, 아니면 다중 매장(멀티테넌트)을 지원해야 하나요?

A) 단일 매장만 지원 (MVP 단계에서는 하나의 매장만)
B) 다중 매장 지원 (처음부터 여러 매장을 관리할 수 있는 구조)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
메뉴 이미지 관리는 어떻게 하시겠습니까?

A) 외부 이미지 URL만 사용 (이미지 호스팅은 별도 서비스 사용)
B) 서버에 직접 이미지 업로드 및 저장 (로컬 파일 시스템)
C) 클라우드 스토리지 사용 (S3 등)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 5
관리자 계정 관리는 어떻게 하시겠습니까?

A) 사전 설정된 단일 관리자 계정 (DB에 직접 등록)
B) 관리자 회원가입 기능 포함
C) 초기 관리자 계정 시딩 + 관리자가 추가 계정 생성 가능
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6
배포 환경은 어떻게 계획하고 계신가요?

A) 로컬 개발 환경만 (Docker Compose 등)
B) 클라우드 배포 (AWS, GCP, Azure 등)
C) VPS 서버 배포 (직접 서버 관리)
D) 아직 미정 (우선 로컬에서 개발 후 결정)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 7
동시 접속 사용자 규모는 어느 정도를 예상하시나요?

A) 소규모 (1개 매장, 테이블 10개 이하, 관리자 1-2명)
B) 중규모 (1-5개 매장, 테이블 50개 이하, 관리자 5명 이하)
C) 대규모 (5개 이상 매장, 테이블 100개 이상)
D) 아직 미정 (소규모로 시작 후 확장 예정)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 8
테이블 태블릿의 세션 만료 시간은 어떻게 설정하시겠습니까? (요구사항에 관리자는 16시간으로 명시되어 있으나, 테이블 태블릿 세션은 명시되지 않았습니다)

A) 관리자와 동일하게 16시간
B) 24시간 (하루 영업시간 기준)
C) 만료 없음 (매장 이용 완료 처리 시에만 세션 리셋)
D) 관리자가 설정 가능하도록
X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 9
주문 상태 실시간 업데이트(고객 화면)는 MVP에 포함하시겠습니까? (요구사항에 "선택사항"으로 표시되어 있습니다)

A) MVP에 포함 (SSE 기반 실시간 업데이트)
B) MVP에서 제외 (수동 새로고침으로 대체)
C) 간단한 폴링 방식으로 구현 (30초 간격 등)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 10
메뉴 관리 기능은 MVP에 포함하시겠습니까? (요구사항 3.2.4에 정의되어 있으나 MVP 범위 섹션에는 명시되지 않았습니다)

A) MVP에 포함 (메뉴 CRUD 전체 구현)
B) MVP에서 제외 (DB 시딩으로 초기 메뉴 데이터 설정)
C) 기본적인 메뉴 등록/수정만 포함 (삭제, 순서 조정은 제외)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 11: Security Extensions
이 프로젝트에 보안 확장 규칙을 적용하시겠습니까?

A) Yes — 모든 SECURITY 규칙을 블로킹 제약으로 적용 (프로덕션 수준 애플리케이션에 권장)
B) No — 모든 SECURITY 규칙 건너뛰기 (PoC, 프로토타입, 실험적 프로젝트에 적합)
X) Other (please describe after [Answer]: tag below)

[Answer]: B
