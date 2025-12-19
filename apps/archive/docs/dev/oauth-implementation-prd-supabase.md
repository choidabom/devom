# Product Requirements Document (PRD)

## Supabase Auth 기반 OAuth for Archive Application

### 1. Overview

**Product**: @devom/archive Supabase Authentication System
**Date**: 2025-12-19
**Status**: Planning Phase

#### 1.1 Purpose

Archive 애플리케이션에 **Supabase Auth를 사용한** OAuth 2.0 인증 시스템을 추가합니다.

#### 1.2 Why Supabase Auth?

- ✅ Supabase를 이미 사용 중
- ✅ OAuth 2.0 완벽 구현 (GitHub, Google 등)
- ✅ NextAuth/Drizzle 불필요
- ✅ RLS로 보안 자동화
- ✅ Realtime 지원
- ✅ 최소 의존성
- ✅ 무료 (프로젝트당 50,000 MAU)

---

### 2. Goals & Non-Goals

#### 2.1 Goals

- ✅ Supabase Auth로 GitHub OAuth 구현
- ✅ Supabase Auth로 Google OAuth 구현
- ✅ Supabase Client로 DB 접근
- ✅ RLS로 데이터 보안
- ✅ 방명록 애플리케이션 활성화
- ✅ Supabase 네이티브 접근

#### 2.2 Non-Goals

- ❌ NextAuth 사용
- ❌ Drizzle/Prisma 사용
- ❌ OAuth 직접 구현
- ❌ 자체 JWT 발급

---

### 3. Technical Architecture

#### 3.1 Technology Stack

```
- Frontend: Next.js 16 (App Router) + React 19
- Auth: Supabase Auth
- Database: Supabase PostgreSQL
- Client: @supabase/supabase-js
- Security: Row Level Security (RLS)
- Deployment: Vercel
```

#### 3.2 Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Browser (Client)                 │
│  - SignInButton (supabase.auth.signIn) │
│  - UserMenu (supabase.auth.getUser)    │
│  - Guestbook                            │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Supabase (All-in-One)              │
│                                          │
│  Auth:                                   │
│  - OAuth providers (GitHub, Google)     │
│  - Session management                   │
│  - JWT 자동 발급                         │
│                                          │
│  Database:                               │
│  - auth.users (Supabase 관리)           │
│  - public.guestbook_entries             │
│                                          │
│  Security:                               │
│  - Row Level Security (RLS)             │
└─────────────────────────────────────────┘
```

#### 3.3 OAuth 인증 흐름

**전체 흐름 개요:**

```
┌─────────────┐
│   사용자    │
└──────┬──────┘
       │
       │ 1. "Sign in with GitHub" 버튼 클릭
       ↓
┌──────────────────────────────────────┐
│  SignInButton Component              │
│  (src/components/auth/)              │
└──────────────┬───────────────────────┘
               │
               │ 2. supabase.auth.signInWithOAuth()
               ↓
┌──────────────────────────────────────┐
│         Supabase Auth                │
│  (https://xxx.supabase.co/auth)      │
└──────────────┬───────────────────────┘
               │
               │ 3. Redirect to GitHub
               ↓
┌──────────────────────────────────────┐
│         GitHub OAuth                 │
│  (github.com/login/oauth)            │
└──────────────┬───────────────────────┘
               │
               │ 4. 사용자가 "Authorize" 클릭
               ↓
┌──────────────────────────────────────┐
│         Supabase Auth                │
│  (code를 session으로 교환)           │
└──────────────┬───────────────────────┘
               │
               │ 5. Redirect with code
               ↓
┌──────────────────────────────────────┐
│  OAuth Callback Handler              │
│  (app/auth/callback/route.ts)        │
│  - code를 받아서 session 생성        │
└──────────────┬───────────────────────┘
               │
               │ 6. Redirect to home
               ↓
┌──────────────────────────────────────┐
│         Home Page                    │
│  - UserMenu 표시 (로그인 상태)       │
└──────────────────────────────────────┘
```

**상세 단계별 흐름:**

```
Step 1: 로그인 버튼 클릭
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
사용자 브라우저 (http://localhost:3000)
  │
  │ Click "Sign in with GitHub"
  ↓
SignInButton.tsx
  │
  │ handleSignIn() 실행
  ↓
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: 'http://localhost:3000/auth/callback'
  }
})

Step 2: Supabase로 리다이렉트
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
브라우저가 자동으로 이동:
https://xxxxx.supabase.co/auth/v1/authorize?
  provider=github
  &redirect_to=http://localhost:3000/auth/callback

Step 3: GitHub OAuth 페이지
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
브라우저가 자동으로 이동:
https://github.com/login/oauth/authorize?
  client_id=YOUR_GITHUB_CLIENT_ID
  &redirect_uri=https://xxxxx.supabase.co/auth/v1/callback

사용자가 "Authorize" 버튼 클릭

Step 4: GitHub → Supabase (Authorization Code)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GitHub가 Supabase로 리다이렉트:
https://xxxxx.supabase.co/auth/v1/callback?
  code=AUTHORIZATION_CODE_FROM_GITHUB

Supabase 내부 동작:
  1. GitHub code를 access_token으로 교환
  2. GitHub API로 사용자 정보 가져오기
  3. Supabase DB에 사용자 저장 (auth.users)
  4. JWT 토큰 생성

Step 5: Supabase → Your Callback
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Supabase가 앱으로 리다이렉트:
http://localhost:3000/auth/callback?
  code=SUPABASE_SESSION_CODE

app/auth/callback/route.ts 실행:

export async function GET(request: Request) {
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
    // ↑ code를 JWT session으로 교환하여 쿠키에 저장
  }

  return NextResponse.redirect(requestUrl.origin)
}

Step 6: 로그인 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
브라우저가 http://localhost:3000 로 이동

쿠키에 저장된 정보:
  - sb-access-token: JWT 토큰 (유효기간 1시간)
  - sb-refresh-token: 리프레시 토큰 (유효기간 30일)

UserMenu.tsx가 사용자 정보 표시:
  - user.user_metadata.avatar_url
  - user.user_metadata.name
  - user.email
```

**URL 변화 순서:**

```
1. http://localhost:3000
   (시작)

2. https://xxxxx.supabase.co/auth/v1/authorize?provider=github&...
   (SignInButton 클릭)

3. https://github.com/login/oauth/authorize?client_id=...
   (Supabase → GitHub)

4. https://xxxxx.supabase.co/auth/v1/callback?code=abc123
   (GitHub → Supabase, 사용자 인증 완료)

5. http://localhost:3000/auth/callback?code=xyz789
   (Supabase → 우리 앱)

6. http://localhost:3000
   (홈으로 리다이렉트, 로그인 완료!)
```

#### 3.4 File Structure

```
apps/archive/
├── app/
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts           # OAuth callback handler (신규 생성)
│   ├── api/
│   │   └── guestbook/
│   │       └── route.ts           # Protected API (RLS) (신규 생성)
│   ├── layout.tsx                 # 기존 파일
│   ├── page.tsx                   # 기존 파일
│   └── providers.tsx              # 기존 파일
├── src/
│   ├── lib/                       # 신규 디렉토리
│   │   └── supabase/
│   │       ├── client.ts          # Client-side client
│   │       └── server.ts          # Server-side client
│   ├── components/
│   │   ├── auth/                  # 신규 디렉토리
│   │   │   ├── SignInButton.tsx   # supabase.auth.signInWithOAuth
│   │   │   └── UserMenu.tsx       # supabase.auth.getUser
│   │   ├── application/           # 기존 디렉토리
│   │   │   └── Guestbook.tsx      # 신규 파일 (방명록)
│   │   ├── portfolio/             # 기존 파일들
│   │   └── desktop/               # 기존 파일들
│   ├── context/                   # 기존 디렉토리
│   ├── hooks/                     # 기존 디렉토리
│   └── types/                     # 기존 디렉토리
└── .env.local                     # 신규 생성
```

---

### 4. Data Models

#### 4.1 Supabase Auth Tables (자동 생성)

**auth.users** (Supabase 관리)

- `id` (UUID, PK)
- `email`, `encrypted_password`
- `email_confirmed_at`
- `raw_app_meta_data`, `raw_user_meta_data`

**auth.identities** (OAuth 계정)

- `id`, `user_id` (FK)
- `provider` ('github', 'google')
- `provider_id`, `identity_data`

#### 4.2 Custom Tables

**public.guestbook_entries**

```sql
CREATE TABLE guestbook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read guestbook"
  ON guestbook_entries FOR SELECT
  USING (true);

-- 로그인한 사용자만 작성 가능
CREATE POLICY "Users can create their own entries"
  ON guestbook_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인만 삭제 가능
CREATE POLICY "Users can delete their own entries"
  ON guestbook_entries FOR DELETE
  USING (auth.uid() = user_id);
```

---

### 5. Supabase 프로젝트 설정

#### 5.1 Supabase 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. "New Project" 클릭
3. Organization 선택 또는 생성
4. 프로젝트 정보 입력:
   - Name: `devom-archive` (또는 원하는 이름)
   - Database Password: 강력한 비밀번호 (저장 필수!)
   - Region: `Northeast Asia (Seoul)` 권장
5. "Create new project" 클릭 (2-3분 소요)

#### 5.2 API Keys 확인

프로젝트 생성 후:

1. Settings → API로 이동
2. 다음 정보 복사:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### 5.3 GitHub OAuth 설정

1. **GitHub OAuth App 생성**:
   - https://github.com/settings/developers 접속
   - "New OAuth App" 클릭
   - Application name: `Devom Archive`
   - Homepage URL: `http://localhost:3000` (개발용)
   - Authorization callback URL: `https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback`
     (위 5.2에서 확인한 Project URL 사용)
   - "Register application" 클릭

2. **Client ID/Secret 복사**:
   - Client ID 복사
   - "Generate a new client secret" 클릭 후 Secret 복사

3. **Supabase에 설정**:
   - Supabase Dashboard → Authentication → Providers
   - GitHub 활성화
   - 위에서 복사한 Client ID와 Secret 입력
   - "Save" 클릭

#### 5.4 환경변수 설정

**apps/archive/.env.local** 파일 생성:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**apps/archive/.env.local.example** 파일 생성 (Git에 커밋용):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

**apps/archive/.gitignore** 확인:

```
# 이미 포함되어 있는지 확인
.env.local
```

---

### 6. Implementation

#### 6.1 Dependencies

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.5.2"
  }
}
```

**참고**: `@supabase/auth-helpers-nextjs`는 deprecated되었으며, `@supabase/ssr`로 대체되었습니다.

#### 6.2 Supabase Client Setup

```typescript
// src/lib/supabase/client.ts (Client Component용)
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
```

```typescript
// src/lib/supabase/server.ts (Server Component/API용)
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}
```

#### 6.3 OAuth Callback Handler

```typescript
// app/auth/callback/route.ts
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(requestUrl.origin)
}
```

#### 6.4 Client Components

```typescript
// src/components/auth/SignInButton.tsx
"use client"

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export function SignInButton() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${location.origin}/auth/callback`
        }
      })

      if (error) {
        setError(error.message)
        console.error('Sign in failed:', error)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Sign in error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={handleSignIn} disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in with GitHub'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
```

```typescript
// src/components/auth/UserMenu.tsx
"use client"

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export function UserMenu() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        console.error('Failed to get user:', error.message)
      }
      setUser(user)
      setLoading(false)
    })
  }, [])

  if (loading) return <div>Loading...</div>
  if (!user) return null

  return (
    <div>
      <img
        src={user.user_metadata.avatar_url}
        alt={user.user_metadata.name || 'User avatar'}
      />
      <span>{user.user_metadata.name || user.email}</span>
      <button onClick={() => supabase.auth.signOut()}>
        Sign Out
      </button>
    </div>
  )
}
```

#### 6.5 Protected API Route (RLS 자동 적용)

```typescript
// app/api/guestbook/route.ts
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = createClient()

  // 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { message } = await request.json()

  // RLS가 자동으로 user_id 검증
  const { data, error } = await supabase.from("guestbook_entries").insert({ user_id: user.id, message }).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

export async function GET() {
  const supabase = createClient()

  // RLS 정책에 따라 모든 데이터 조회 가능
  const { data } = await supabase.from("guestbook_entries").select("*, user:user_id(id, email, raw_user_meta_data)").order("created_at", { ascending: false })

  return NextResponse.json(data)
}
```

---

### 7. Row Level Security (RLS) 상세 설명

#### 7.1 RLS란?

**Row Level Security (행 단위 보안)** = PostgreSQL의 데이터베이스 레벨 보안 정책

DB가 직접 각 행(Row)에 대한 접근 권한을 자동으로 검증합니다.

#### 7.2 전통적인 방식 vs RLS

**전통적인 방식 (백엔드 코드로 검증):**

```typescript
// ❌ 모든 API에서 수동 권한 체크 필요
export async function DELETE(request: Request) {
  const session = await getServerSession()

  // 1. 로그인 체크
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await request.json()

  // 2. 데이터 조회
  const entry = await db.guestbook_entries.findUnique({ where: { id } })

  // 3. 소유권 체크 (깜빡하면 보안 구멍!)
  if (entry.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // 4. 삭제
  await db.guestbook_entries.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
```

**문제점:**

- ❌ 개발자가 실수하면 보안 구멍 발생
- ❌ 모든 API에서 반복적인 권한 체크 필요
- ❌ 직접 DB 접근 시 권한 무시됨

**RLS 방식 (DB에서 자동 검증):**

```typescript
// ✅ RLS가 자동으로 검증
export async function DELETE(request: Request) {
  const supabase = createClient()
  const { id } = await request.json()

  // RLS가 자동으로:
  // 1. 현재 사용자 확인 (auth.uid())
  // 2. userId가 일치하는지 검증
  // 3. 권한 없으면 자동 차단
  const { error } = await supabase.from("guestbook_entries").delete().eq("id", id)

  // 권한 없으면 error 발생 (자동!)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
```

**장점:**

- ✅ DB가 자동으로 권한 체크
- ✅ 개발자 실수 방지
- ✅ 모든 접근 경로에 적용 (API, Client, Direct DB 등)
- ✅ SQL Injection 방어

#### 7.3 RLS 정책 작동 예시

**정책 정의:**

```sql
-- 정책: 본인 것만 삭제 가능
CREATE POLICY "Users can delete their own entries"
  ON guestbook_entries
  FOR DELETE
  USING (auth.uid() = user_id);
  -- ↑ auth.uid() = 현재 로그인한 사용자의 ID
```

**작동 방식:**

**Case 1: 본인 것 삭제 (성공)**

```typescript
// Alice (user_id: 'alice-123')가 로그인한 상태

const { data } = await supabase.from("guestbook_entries").delete().eq("id", "alice-entry-id") // user_id = 'alice-123'

// ✅ 성공
// RLS 체크: auth.uid() = 'alice-123' = user_id
```

**Case 2: 남의 것 삭제 시도 (실패)**

```typescript
// Alice가 Bob의 글 삭제 시도

const { error } = await supabase.from("guestbook_entries").delete().eq("id", "bob-entry-id") // user_id = 'bob-456'

// ❌ 실패
// RLS 체크: auth.uid() = 'alice-123' ≠ 'bob-456'
// error: "new row violates row-level security policy"
```

**Case 3: 비로그인 상태 (실패)**

```typescript
// 로그인 안 한 상태

const { error } = await supabase.from("guestbook_entries").delete().eq("id", "any-entry-id")

// ❌ 실패
// RLS 체크: auth.uid() = null
```

#### 7.4 RLS의 핵심 장점

**1. 개발자 실수 방지**

```typescript
// 개발자가 권한 체크를 깜빡해도 DB가 막아줌
export async function DELETE(request: Request) {
  const supabase = createClient()
  const { id } = await request.json()

  // 권한 체크 코드 없어도 안전!
  const { error } = await supabase.from("guestbook_entries").delete().eq("id", id)
  // ↑ RLS가 자동으로 권한 체크
}
```

**2. 모든 접근 경로 보호**

```typescript
// API Route
await supabase.from('guestbook').delete()  // ✅ RLS 적용

// Server Component
await supabase.from('guestbook').delete()  // ✅ RLS 적용

// Client Component (브라우저)
await supabase.from('guestbook').delete()  // ✅ RLS 적용

// SQL Editor (Supabase Dashboard)
DELETE FROM guestbook_entries WHERE id = 'x';  // ✅ RLS 적용

// 직접 DB 연결
psql> DELETE FROM guestbook_entries WHERE id = 'x';  // ✅ RLS 적용
```

**3. Zero Trust 보안 모델**

```
전통적인 방식:
"백엔드를 믿어라" → 백엔드 버그 = 보안 문제

RLS 방식:
"DB가 최종 방어선" → 백엔드 버그여도 DB가 막음
```

#### 7.5 Supabase에서 RLS가 필수인 이유

**Supabase의 특징:**

- 브라우저에서 직접 DB 접근 가능
- Client-side에서 Supabase Client 사용

**RLS 없으면:**

```typescript
// 브라우저에서 직접 실행 (누구나 가능!)
const supabase = createClient()

// RLS 없으면 모든 데이터 삭제 가능 💥
await supabase.from("guestbook_entries").delete().neq("id", "")
```

**RLS 있으면:**

```typescript
// 브라우저에서 실행해도 안전
const supabase = createClient()

// RLS가 자동으로 본인 것만 삭제
await supabase.from("guestbook_entries").delete().neq("id", "")
// ✅ 본인 데이터만 삭제됨 (자동!)
```

#### 7.6 RLS 정책 권장사항

**Guestbook 테이블 기준:**

| 작업              | 정책               | 이유                         |
| ----------------- | ------------------ | ---------------------------- |
| **읽기 (SELECT)** | 모두 허용          | 방명록은 공개                |
| **작성 (INSERT)** | 로그인 + 본인 것만 | 다른 사람 이름으로 작성 방지 |
| **수정 (UPDATE)** | 본인 것만          | 남의 글 수정 방지            |
| **삭제 (DELETE)** | 본인 것만          | 남의 글 삭제 방지            |

---

### 8. Implementation Phases

#### Phase 1: Supabase Setup

- [ ] Install @supabase/supabase-js
- [ ] Set up Supabase clients (client/server)
- [ ] Configure environment variables
- [ ] Enable GitHub provider in Supabase

#### Phase 2: Authentication

- [ ] Implement OAuth callback handler
- [ ] Implement SignInButton
- [ ] Implement UserMenu
- [ ] Test OAuth flow

#### Phase 3: Database & RLS

- [ ] Create guestbook_entries table
- [ ] Set up RLS policies
- [ ] Test RLS enforcement

#### Phase 4: Guestbook Feature

- [ ] Implement GET /api/guestbook
- [ ] Implement POST /api/guestbook
- [ ] Implement DELETE /api/guestbook/:id
- [ ] Build Guestbook component
- [ ] Test with RLS

#### Phase 5: Polish

- [ ] Add Google OAuth
- [ ] Error handling
- [ ] Loading states
- [ ] Testing

#### Phase 6: Deployment

- [ ] Deploy to Vercel
- [ ] Update OAuth callback URLs
- [ ] Test production flow

---

### 9. 장점 요약

**Supabase Native 접근 방식:**

- ✅ 최소 의존성 (@supabase/supabase-js만 필요)
- ✅ RLS로 보안 자동화
- ✅ Supabase의 모든 기능 사용 가능
- ✅ Realtime 지원 (방명록 실시간 업데이트)
- ✅ 간단한 코드베이스
- ✅ 유지보수 용이

---

**Last Updated**: 2025-12-19
**Document Owner**: @dabom-choi
**Status**: Ready for Implementation
