# Supabase 방명록 설정 가이드

## 사전 준비사항

1. Supabase 프로젝트 ([supabase.com](https://supabase.com)에서 생성)
2. `.env.local` 파일에 환경 변수 설정

## 설정 방법

### 1. Supabase 테이블 생성

Supabase SQL 에디터에서 마이그레이션 파일을 실행하세요:

```bash
# 마이그레이션 파일 위치:
# apps/archive/supabase/migrations/create_guestbook_table.sql
```

또는 아래 SQL을 직접 복사해서 실행하세요:

```sql
-- guestbook 테이블 생성
create table if not exists public.guestbook (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  message text not null,
  emoji text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security 활성화
alter table public.guestbook enable row level security;

-- 정책 생성
create policy "Anyone can read guestbook entries"
  on public.guestbook for select
  using (true);

create policy "Authenticated users can insert guestbook entries"
  on public.guestbook for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can update their own guestbook entries"
  on public.guestbook for update
  using (auth.uid() = user_id);

create policy "Users can delete their own guestbook entries"
  on public.guestbook for delete
  using (auth.uid() = user_id);

-- 빠른 쿼리를 위한 인덱스 생성
create index if not exists guestbook_created_at_idx on public.guestbook(created_at desc);
create index if not exists guestbook_user_id_idx on public.guestbook(user_id);
```

### 2. Realtime 활성화 (선택사항이지만 권장)

Supabase 대시보드에서:

1. Database → Replication 메뉴로 이동
2. `guestbook` 테이블의 Replication 활성화

이렇게 하면 새 메시지가 작성될 때 실시간으로 업데이트됩니다.

### 3. 환경 변수 설정

`.env.local` 파일에 Supabase 인증 정보가 있는지 확인하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. GitHub OAuth 설정 (아직 설정하지 않았다면)

1. Supabase Dashboard → Authentication → Providers
2. GitHub provider 활성화
3. GitHub OAuth 앱 인증 정보 추가

## 주요 기능

- **실시간 업데이트**: 모든 사용자에게 새 메시지가 즉시 표시됨
- **인증**: 로그인한 사용자의 이름과 아바타가 자동으로 저장됨
- **익명 작성**: 로그인 없이도 메시지 작성 가능
- **Row Level Security**: 사용자는 자신의 메시지만 수정/삭제 가능
- **영구 저장소**: 모든 메시지가 Supabase에 저장됨 (localStorage 사용 안 함)

## 데이터 마이그레이션 (기존 localStorage 데이터가 있는 경우)

기존에 localStorage에 저장된 방명록 항목이 있다면, 이 업데이트 후에는 표시되지 않습니다. 새 시스템은 모든 사용자가 공유하는 Supabase 영구 저장소를 사용합니다.

기존 데이터를 수동으로 마이그레이션하려면:

1. 업데이트 전에 localStorage 데이터를 내보내기
2. Supabase 대시보드 또는 API를 사용해서 데이터 삽입

## 문제 해결

- **메시지가 표시되지 않음**: 브라우저 콘솔에서 에러 확인
- **메시지를 작성할 수 없음**: Supabase URL과 anon key가 올바른지 확인
- **실시간 업데이트가 작동하지 않음**: Supabase에서 guestbook 테이블의 Replication을 활성화했는지 확인
