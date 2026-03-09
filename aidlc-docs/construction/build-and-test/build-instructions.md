# Build Instructions

## 사전 요구사항
- **Node.js**: v18.17 이상 (LTS 권장)
- **npm**: v9 이상 (Node.js 포함)
- **OS**: macOS / Linux / Windows
- **디스크**: 500MB 이상 여유 공간

## 빌드 단계

### 1. 프로젝트 초기화

```bash
cd table-order
npm init -y
```

### 2. 의존성 설치

```bash
# Next.js + React
npm install next@latest react@latest react-dom@latest

# SQLite
npm install better-sqlite3

# TypeScript + 타입 정의
npm install -D typescript @types/react @types/react-dom @types/node @types/better-sqlite3

# Tailwind CSS
npm install -D tailwindcss @tailwindcss/postcss postcss

# 테스트 프레임워크
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

### 3. 설정 파일 생성

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### next.config.ts
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 이미지 업로드 경로 설정
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
};

export default nextConfig;
```

#### postcss.config.mjs
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

#### src/app/globals.css
```css
@import "tailwindcss";
```

#### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### package.json scripts 추가
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### 4. 디렉터리 생성

```bash
# 이미지 업로드 디렉터리
mkdir -p public/uploads

# SQLite 데이터 디렉터리
mkdir -p data
```

### 5. 빌드 실행

```bash
# TypeScript 타입 체크
npx tsc --noEmit

# Next.js 빌드
npm run build
```

### 6. 빌드 성공 확인
- **정상 출력**: `✓ Compiled successfully` 메시지
- **빌드 산출물**: `.next/` 디렉터리 생성
- **허용 경고**: Unit 1, 2 미구현으로 인한 import 에러는 해당 유닛 구현 후 해소

## 현재 빌드 제약사항

현재 Unit 3, Unit 4만 구현된 상태이므로 다음 모듈이 미구현입니다:
- `@/lib/db` (Unit 1) — Database Module
- `@/lib/auth` (Unit 1) — Auth Module
- `@/lib/sse` (Unit 1) — SSE Module
- `@/lib/order` (Unit 2) — Order Module

Unit 1, 2 구현 후 전체 빌드가 정상 동작합니다.

## 트러블슈팅

### better-sqlite3 설치 실패
- **원인**: 네이티브 모듈 빌드 도구 미설치
- **해결**: `npm install -g node-gyp` 후 재시도. macOS는 `xcode-select --install` 필요

### TypeScript 경로 별칭(@/) 인식 실패
- **원인**: tsconfig.json의 paths 설정 누락
- **해결**: `"paths": { "@/*": ["./src/*"] }` 확인

### Tailwind CSS 클래스 미적용
- **원인**: postcss 설정 또는 globals.css import 누락
- **해결**: `postcss.config.mjs` 확인, `src/app/layout.tsx`에서 `globals.css` import 확인
