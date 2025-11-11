# Frontend Coding Rules

> React/TypeScript 프로젝트 코딩 표준 (Next.js 15 + Shadcn UI)

**Version**: 1.1
**Last Updated**: 2025-11-11

**📖 중요**: 이 문서와 함께 프로젝트 루트의 [CONVENTION.md](../../../CONVENTION.md)를 반드시 참고하세요.

---

## 0. 핵심 원칙 (CONVENTION.md 기반)

### 기본 규칙
- ✅ **함수형, 선언형 프로그래밍** 우선
- ✅ **named export** 사용 (`export function Component() {}`)
- ✅ **RORO 패턴** 사용 (Receive an Object, Return an Object)
- ✅ **순수 함수**는 `function` 키워드 사용
- ❌ **enum** 금지 → 객체 리터럴 + `as const` 사용
- ❌ 불필요한 **세미콜론(`;`)** 사용 금지

### 네이밍
- 변수: `isLoading`, `hasError` (의미 있고 동사형)
- 훅: `useProduct`, `useUserData` (use 접두사)
- 컴포넌트: `UserProfile` (PascalCase, named export)

### API 서비스
```typescript
// ✅ Correct - class with static methods
export class UserService {
  public static async getUser(id: number) {
    const { data } = await baseApi.get(`/users/${id}`)
    return data
  }
}
```

### 에러 처리
- ✅ **Early return** 사용
- ✅ **Guard Clause**로 전제 조건 차단
- ✅ 성공 케이스는 함수 마지막에 위치
- ❌ 중첩된 `if` 금지
- ❌ `else` 최소화

### React/Next.js
- ✅ **RSC(Server Component)** 기본 사용
- ✅ `use client` 최소화
- ✅ **Suspense + fallback** 사용
- ✅ **zod** + **react-hook-form** 조합
- ❌ `useEffect`, `setState` 최소화

---

## 1. TypeScript 규칙

### 타입 안전성
- ❌ `any` 사용 금지
- ✅ 명시적 반환 타입 정의
- ✅ 제네릭 활용
- ✅ Type narrowing 패턴
- ✅ Strict mode 준수

```typescript
// ❌ Wrong
function getData(id: any): any {
  return fetch(`/api/${id}`);
}

// ✅ Correct
async function getData<T>(id: string): Promise<T> {
  const response = await fetch(`/api/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  return response.json() as T;
}
```

### 타입 vs Interface vs Type

| 사용처 | 선택 | 예시 |
|-------|------|------|
| Props, 객체 | `interface` | `ButtonProps` |
| Union types | `type` | `Status = 'idle' \| 'loading'` |
| Intersection | `type` | `Combined = A & B` |
| Generic constraint | `type` | `Extend<T extends Base>` |

```typescript
// Props - interface
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  onClick: () => void;
  disabled?: boolean;
}

// Union type
type Status = 'idle' | 'loading' | 'success' | 'error';

// Generic
type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};
```

### 제네릭 활용

```typescript
// ❌ Wrong - 하드코딩된 타입
function handleResponse(data: any) {
  return { success: true, data };
}

// ✅ Correct - 제네릭
function handleResponse<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

// 사용
const result = handleResponse<User>(userData);
```

---

## 2. 컴포넌트 규칙

### 기본 구조

```typescript
import { FC, ReactNode, useMemo } from 'react';

/**
 * 재사용 가능한 버튼 컴포넌트
 *
 * @example
 * <Button variant="primary" onClick={() => alert('clicked')}>
 *   Click me
 * </Button>
 */
export interface ButtonProps {
  /**
   * 버튼의 시각적 스타일
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'danger';

  /**
   * 버튼의 크기
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /** 버튼 내용 */
  children: ReactNode;

  /** 클릭 핸들러 */
  onClick?: () => void;

  /** 비활성화 여부 */
  disabled?: boolean;

  /** 로딩 상태 */
  isLoading?: boolean;

  /** CSS 클래스 */
  className?: string;
}

export const Button(ButtonProps) {{
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  isLoading = false,
  className = '',
}) {
  const baseClass = `button button--${variant} button--${size}`;
  const finalClass = `${baseClass} ${className}`;

  return (
    <button
      className={finalClass}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      type="button"
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};

```

### 컴포넌트 규칙 체크리스트

- [ ] 함수형 컴포넌트만 사용 (no class)
- [ ] Props는 `interface`로 정의
- [ ] JSDoc 주석 필수 (`@example` 포함)
- [ ] 컴포넌트당 최대 200줄
- [ ] 단일 책임 원칙 (SRP)
- [ ] Props 기본값 설정
- [ ] 옵셔널 Props는 `?` 표시
- [ ] Children 타입 명시 (`ReactNode`)

### 조건부 렌더링

```typescript
// ✅ Correct - 명시적
if (user === null) {
  return null;
}

return <UserProfile user={user} />;

// ✅ Correct - 삼항 연산자 (간단할 때)
return isLoading ? <Spinner /> : <Content />;

// ✅ Correct - 논리 연산자 (간단할 때)
return hasError && <ErrorMessage />;

// ❌ Avoid - 중복 조건
{hasError && isLoading && <div>Error and Loading</div>}
```

---

## 3. 커스텀 훅 규칙

### 네이밍 컨벤션
- `use{Name}` 패턴 필수
- 기능 설명적 네이밍
- 약자 최소화

```typescript
// ✅ Good
useUserData(), useFormValidation(), useLocalStorage()

// ❌ Avoid
useUD(), useFV(), useLS()
```

### 기본 구조

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 사용자 데이터를 API에서 패칭하는 훅
 *
 * @param userId - 조회할 사용자 ID
 * @param options - 훅 옵션
 * @returns 사용자 데이터, 로딩 상태, 에러, 리페치 함수
 *
 * @example
 * const { data, loading, error, refetch } = useUserData('123');
 */
export interface UseUserDataOptions {
  skip?: boolean;
  retry?: number;
}

export interface UseUserDataReturn {
  data: User | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useUserData(
  userId: string,
  options: UseUserDataOptions = {}
): UseUserDataReturn => {
  const { skip = false, retry = 3 } = options;

  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);
  const retryCountRef = useRef(0);

  // Fetch 함수
  const fetchUser = useCallback(async () {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const userData = await response.json() as User;
      setData(userData);
      retryCountRef.current = 0;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);

      // 재시도 로직
      if (retryCountRef.current < retry) {
        retryCountRef.current += 1;
        setTimeout(fetchUser, 1000 * retryCountRef.current);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, retry]);

  // 마운트 시 데이터 로드
  useEffect(() {
    if (!skip) {
      fetchUser();
    }
  }, [userId, skip, fetchUser]);

  return { data, loading, error, refetch: fetchUser };
};
```

### 훅 개발 체크리스트

- [ ] 반환 타입 명시 (`interface` 또는 `type`)
- [ ] ESLint exhaustive-deps 준수
- [ ] 클린업 함수 구현 (이벤트 리스너 등)
- [ ] JSDoc 주석 필수 (`@param`, `@returns`, `@example`)
- [ ] 메모리 누수 방지 (AbortController 사용)
- [ ] 경쟁 조건(race condition) 처리
- [ ] 에러 타입 안전성

### 클린업 함수 패턴

```typescript
export function useWindowResize(callback: (width: number) => void) {
  useEffect(() {
    // 핸들러 정의
    const handleResize = () {
      callback(window.innerWidth);
    };

    // 이벤트 리스너 등록
    window.addEventListener('resize', handleResize);

    // 클린업: 메모리 누수 방지
    return () {
      window.removeEventListener('resize', handleResize);
    };
  }, [callback]);
};
```

### 비동기 작업 안전성

```typescript
export const useFetchData = <T,>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() {
    // AbortController로 경쟁 조건 방지
    const controller = new AbortController();

    const fetchData = async () {
      try {
        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json() as T;
        setData(json);
      } catch (err) {
        // 캔슬된 요청은 무시
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    };

    fetchData();

    // 언마운트 시 요청 캔슬
    return () => controller.abort();
  }, [url]);

  return { data, error };
};
```

---

## 4. 스타일 규칙

### CSS Modules (권장)

```typescript
import styles from './Button.module.css';

<button className={styles.button}>Click</button>
```

**CSS Module 작성 규칙:**
- [ ] `{ComponentName}.module.css` 파일명
- [ ] kebab-case 클래스명
- [ ] BEM 패턴 (필요시)

```css
/* Button.module.css */
.button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button--primary {
  background-color: #3b82f6;
  color: white;
}

.button--primary:hover:not(:disabled) {
  background-color: #2563eb;
}
```

### Tailwind CSS (대안)

```typescript
<button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors">
  Click
</button>

// 복잡한 경우 - clsx 사용
import clsx from 'clsx';

const buttonClass = clsx(
  'px-4 py-2 rounded transition-colors',
  {
    'bg-blue-500 hover:bg-blue-600': variant === 'primary',
    'bg-gray-500 hover:bg-gray-600': variant === 'secondary',
    'opacity-50 cursor-not-allowed': disabled,
  }
);

<button className={buttonClass}>Click</button>
```

### 스타일 작성 규칙

- [ ] 인라인 스타일 최소화 (성능)
- [ ] 클래스명 kebab-case
- [ ] 반응형 디자인 (mobile-first)
- [ ] CSS 변수 활용 (테마)
- [ ] 색상/크기 토큰 사용

---

## 5. 네이밍 컨벤션

### 전체 네이밍 가이드

| 타입 | 규칙 | 예시 | 파일명 |
|------|------|------|--------|
| 컴포넌트 | PascalCase | `UserProfile` | `UserProfile.tsx` |
| Props 인터페이스 | `{Name}Props` | `ButtonProps` | `Button.types.ts` |
| 훅 | use + PascalCase | `useUserData` | `useUserData.ts` |
| 함수 | camelCase | `getUserData` | `user-utils.ts` |
| 상수 | UPPER_SNAKE_CASE | `API_BASE_URL` | `constants.ts` |
| 타입/인터페이스 | PascalCase | `User`, `Status` | `types.ts` |
| 변수 | camelCase | `userData` | - |
| 부울 변수 | is/has + PascalCase | `isLoading`, `hasError` | - |
| 이벤트 핸들러 | handle + PascalCase | `handleClick` | - |
| 콜백 함수 | on + PascalCase | `onChange` | - |

### 예제

```typescript
// ✅ Correct
interface UserProfileProps {
  userId: string;
  onUserLoaded?: (user: User) => void;
}

const useUserProfile = (userId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);

  const handleFetchUser = async () {
    // ...
  };

  return { userData, isLoading, handleFetchUser };
};

const UserProfile(UserProfileProps) {{ userId, onUserLoaded }) {
  const { userData, isLoading } = useUserProfile(userId);

  return <div>{userData?.name}</div>;
};
```

---

## 6. 파일 구조

### 컴포넌트 디렉토리 구조

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx              # 컴포넌트 로직
│   │   ├── Button.types.ts         # Props 타입
│   │   ├── Button.module.css       # 스타일
│   │   ├── Button.test.tsx         # 단위 테스트
│   │   ├── Button.stories.tsx      # Storybook (선택)
│   │   └── index.ts                # Export
│   └── UserProfile/
│       ├── UserProfile.tsx
│       ├── UserProfile.types.ts
│       ├── UserProfile.module.css
│       ├── UserProfile.test.tsx
│       └── index.ts
├── hooks/
│   ├── useUserData.ts
│   ├── useLocalStorage.ts
│   └── index.ts
├── utils/
│   ├── date-utils.ts
│   ├── string-utils.ts
│   └── index.ts
├── types/
│   ├── common.ts
│   ├── api.ts
│   └── user.ts
├── styles/
│   ├── global.css
│   ├── variables.css
│   └── theme.css
└── App.tsx
```

### Import 순서

```typescript
// 1. React & hooks
import { FC, useState, useCallback } from 'react';

// 2. 외부 라이브러리
import clsx from 'clsx';

// 3. 내부 컴포넌트
import { Button } from '@/components';
import { UserCard } from '@/components/UserCard';

// 4. 내부 훅
import { useUserData } from '@/hooks';

// 5. 유틸 함수
import { formatDate } from '@/utils/date-utils';

// 6. 타입 (Type-only imports)
import type { User } from '@/types';

// 7. 스타일
import styles from './Component.module.css';

// 8. 상수
import { API_BASE_URL } from '@/constants';
```

**Type-only imports 사용:**
```typescript
// ✅ Correct - 타입만 import
import type { User, Post } from '@/types';

// ❌ Avoid - 타입도 일반 import
import { User, Post } from '@/types';
```

---

## 7. 성능 최적화

### 메모이제이션 패턴

```typescript
import { useCallback, useMemo, memo } from 'react';

// 1. useCallback - 함수 메모이제이션
const handleClick = useCallback(() {
  console.log('clicked');
}, []);

// 2. useMemo - 값 메모이제이션
const filteredData = useMemo(() {
  return data.filter(item => item.active);
}, [data]);

// 3. memo - 컴포넌트 메모이제이션
interface ExpensiveComponentProps {
  data: User[];
}

export const ExpensiveComponent = memo<ExpensiveComponentProps>(
  ({ data }) {
    return <div>{data.length}</div>;
  },
  // 커스텀 비교 함수 (필요 시)
  (prev, next) => prev.data.length === next.data.length
);

```

### 성능 최적화 체크리스트

- [ ] 이벤트 핸들러는 useCallback
- [ ] 비싼 계산은 useMemo
- [ ] 리스트 아이템 조건부 memo
- [ ] 무한 루프 방지 (dependency array)
- [ ] 불필요한 리렌더 방지
- ❌ 과도한 최적화는 코드 복잡도 증가

### 성능 측정

```typescript
import { Profiler, ProfilerOnRenderCallback } from 'react';

const onRenderCallback: ProfilerOnRenderCallback = (
  id, phase, actualDuration
) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
};

<Profiler id="Button" onRender={onRenderCallback}>
  <Button>Click</Button>
</Profiler>
```

---

## 8. 접근성 (a11y)

### 시맨틱 HTML

```typescript
// ❌ Wrong - div로 전부 만들기
<div onClick={handleClick}>Click</div>
<div role="button">Click</div>

// ✅ Correct - 시맨틱 요소 사용
<button onClick={handleClick}>Click</button>
<a href="/page">Link</a>
<main>Main content</main>
<nav>Navigation</nav>
<article>Article</article>
```

### ARIA 속성

```typescript
// 라벨 및 설명
<button aria-label="닫기">×</button>
<input aria-describedby="hint" />
<span id="hint">유효한 이메일을 입력하세요</span>

// 상태
<button aria-expanded={isOpen} aria-pressed={isActive}>
  Toggle
</button>
<div aria-busy={isLoading}>Loading...</div>

// 라이브 영역
<div aria-live="polite" aria-atomic="true">
  {notification}
</div>
```

### 접근성 체크리스트

- [ ] 시맨틱 HTML 우선 (div 최소화)
- [ ] ARIA 속성 추가 (필요시)
- [ ] 키보드 접근성 (Tab, Enter, Space, Escape)
- [ ] 색상 대비 WCAG AA (4.5:1)
- [ ] 폼 라벨 연결 (`htmlFor`)
- [ ] Skip links (navigation)
- [ ] 스크린 리더 테스트

```typescript
// Form 라벨
<label htmlFor="email">Email:</label>
<input id="email" type="email" />

// Skip link
<a href="#main" className="skip-link">Skip to main content</a>
<main id="main">Main content</main>
```

---

## 9. 에러 처리

### Error Boundary

```typescript
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}
```

### 비동기 에러 처리

```typescript
// Try-catch
try {
  const data = await fetchData();
  setData(data);
} catch (err) {
  setError(err instanceof Error ? err : new Error('Unknown error'));
}

// Promise chains
fetchData()
  .then(data => setData(data))
  .catch(err => setError(err));

// 에러 타입 검사
if (error instanceof TypeError) {
  // TypeError 처리
} else if (error instanceof ReferenceError) {
  // ReferenceError 처리
} else if (error instanceof Error) {
  // 일반 Error
}
```

### 사용자 친화적 에러 메시지

```typescript
// ❌ Wrong
setError(error);  // 기술적 에러

// ✅ Correct
const getUserFriendlyMessage = (error: Error): string => {
  if (error.message.includes('404')) {
    return '데이터를 찾을 수 없습니다.';
  }
  if (error.message.includes('401')) {
    return '로그인이 필요합니다.';
  }
  if (error.message.includes('Network')) {
    return '네트워크 연결을 확인해주세요.';
  }
  return '요청 처리 중 오류가 발생했습니다.';
};

setError(getUserFriendlyMessage(error));
```

---

## 10. 보안

### XSS (Cross-Site Scripting) 방어

```typescript
// ❌ Dangerous - XSS 취약점
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Safe - React가 자동 escape
<div>{userInput}</div>

// HTML 속성 sanitize 필요시
import DOMPurify from 'dompurify';
<div>{DOMPurify.sanitize(userInput)}</div>
```

### CSRF (Cross-Site Request Forgery) 방지

```typescript
// CSRF 토큰 포함
const csrfToken = document.querySelector('meta[name="csrf-token"]')
  ?.getAttribute('content');

const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken || '',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});
```

### 보안 체크리스트

- [ ] `dangerouslySetInnerHTML` 사용 금지
- [ ] 사용자 입력 검증 (서버 사이드)
- [ ] localStorage에 민감 정보 저장 금지
- [ ] HTTPS only
- [ ] CSRF 토큰 사용
- [ ] Content Security Policy (CSP)
- [ ] 환경변수 보호 (민감 정보)

```typescript
// ❌ Wrong - 환경변수 노출
const API_KEY = 'sk-123456';  // 공개 코드

// ✅ Correct - 환경변수 사용
const API_KEY = import.meta.env.VITE_API_KEY;

// .env 파일
VITE_API_KEY=sk-123456  // 커밋 금지
```

---

## 11. 테스트 규칙

### 테스트 작성 원칙

- [ ] AAA 패턴 (Arrange, Act, Assert)
- [ ] 각 테스트 독립적
- [ ] 명확한 테스트명
- [ ] 1개 테스트 = 1개 시나리오
- [ ] 80%+ 커버리지

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () {
  it('should render button with text', () {
    // Arrange
    const props = { children: 'Click me' };

    // Act
    render(<Button {...props} />);

    // Assert
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () {
    // Arrange
    const onClick = vi.fn();

    // Act
    const { user } = render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole('button'));

    // Assert
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

---

## 12. 주석 및 문서화

### JSDoc 패턴

```typescript
/**
 * 사용자 데이터를 조회합니다.
 *
 * @param userId - 조회할 사용자의 고유 ID
 * @param options - 조회 옵션
 * @param options.cache - 캐시 사용 여부 (기본값: true)
 * @returns 사용자 정보 Promise
 * @throws {Error} 사용자를 찾을 수 없거나 네트워크 오류 발생
 *
 * @example
 * const user = await fetchUser('123');
 * const user = await fetchUser('123', { cache: false });
 */
async function fetchUser(
  userId: string,
  options?: { cache?: boolean }
): Promise<User> {
  // ...
}
```

### 주석 작성 규칙

- [ ] "Why"를 설명 ("What"은 코드가 설명)
- [ ] 과도한 주석 피하기
- [ ] TODO, FIXME, HACK 사용
- [ ] JSDoc 필수 (public 함수/컴포넌트)

```typescript
// ✅ Good - Why를 설명
// 사용자 ID는 URL 파라미터에서 추출하지 않음
// (보안 문제: URL 변조로 다른 사용자 데이터 접근 가능)
const userId = user?.id;

// ❌ Bad - 너무 자명함
// userId에 user의 id를 할당
const userId = user?.id;
```

---

## Summary Checklist

### 필수 규칙 (MUST)
- [ ] TypeScript strict mode
- [ ] Props는 interface로 정의
- [ ] JSDoc 주석 (public API)
- [ ] Error 타입 안전성
- [ ] 시맨틱 HTML
- [ ] 테스트 작성

### 권장 사항 (SHOULD)
- [ ] 메모이제이션 활용
- [ ] 접근성 고려
- [ ] CSS Modules 사용
- [ ] 성능 측정
- [ ] 보안 검토

### 선택 사항 (NICE TO HAVE)
- [ ] Storybook
- [ ] E2E 테스트
- [ ] 성능 최적화
- [ ] 애니메이션

---

**Document Status**: Published
**Maintained by**: Frontend Team
**Last Review**: 2025-11-11
