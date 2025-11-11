# Frontend Testing Patterns

> Vitest, Testing Library, 그리고 E2E 테스트 패턴

**Version**: 1.0
**Last Updated**: 2025-11-11

---

## 1. Vitest 기초

### 셋업

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 테스트 파일 구조

```typescript
// Button.test.tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  // 각 테스트 전 실행
  beforeEach(() => {
    // Setup
  });

  // 각 테스트 후 실행
  afterEach(() => {
    // Cleanup
  });

  it('should render button with text', () => {
    // Test code
  });
});
```

---

## 2. Testing Library - 컴포넌트 테스트

### AAA 패턴

```typescript
describe('Button', () => {
  it('should render button with correct text', () => {
    // Arrange: 테스트 환경 설정
    const text = 'Click me';

    // Act: 컴포넌트 렌더링
    render(<Button>{text}</Button>);

    // Assert: 결과 검증
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
```

### Query 메서드

```typescript
describe('Form', () => {
  it('should find elements by different queries', () => {
    render(
      <form>
        <label htmlFor="email">Email:</label>
        <input id="email" type="email" />
        <button>Submit</button>
      </form>
    );

    // 1. getBy* - 없으면 throw (단일 요소)
    const input = screen.getByRole('textbox', { name: /email/i });
    const button = screen.getByRole('button', { name: /submit/i });

    // 2. queryBy* - 없으면 null (요소 없음 검증)
    const notFound = screen.queryByText('Not Found');
    expect(notFound).not.toBeInTheDocument();

    // 3. findBy* - 비동기 (요소 로드 대기)
    const asyncElement = await screen.findByText('Async Text');

    // 4. getAllBy* - 여러 요소
    const allButtons = screen.getAllByRole('button');
  });
});
```

### 우선순위 (권장 순서)

1. ✅ Role, Label - 접근성 기준
2. ✅ PlaceholderText
3. ✅ DisplayValue
4. ⚠️ TestId
5. ❌ Text, Title (마지막 수단)

```typescript
// ✅ Best - Role로 쿼리
screen.getByRole('button', { name: /submit/i });

// ✅ Good - Form 연결
screen.getByLabelText('Email');

// ⚠️ Okay - TestId (보조용)
screen.getByTestId('submit-button');

// ❌ Avoid - 너무 구체적
screen.getByText('Click me now');
```

---

## 3. 사용자 상호작용 테스트

### userEvent vs fireEvent

```typescript
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';

describe('Input', () => {
  it('should handle user input', async () => {
    const { user } = render(<input />);
    const input = screen.getByRole('textbox');

    // ✅ userEvent (권장) - 실제 사용자 동작 시뮬레이션
    await user.type(input, 'Hello');
    expect(input).toHaveValue('Hello');

    // ❌ fireEvent (피하기) - DOM 이벤트 직접 발생
    fireEvent.change(input, { target: { value: 'World' } });
  });
});
```

### 클릭 테스트

```typescript
describe('Button Click', () => {
  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();
    const { user } = render(<Button onClick={onClick}>Click</Button>);

    // 버튼 클릭
    await user.click(screen.getByRole('button'));

    // 콜백 검증
    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledWith();
  });

  it('should handle double click', async () => {
    const onDoubleClick = vi.fn();
    const { user } = render(
      <button onDoubleClick={onDoubleClick}>Double Click</button>
    );

    await user.dblClick(screen.getByRole('button'));

    expect(onDoubleClick).toHaveBeenCalledOnce();
  });
});
```

### Form 입력

```typescript
describe('Form Interaction', () => {
  it('should fill and submit form', async () => {
    const onSubmit = vi.fn();
    const { user } = render(
      <form onSubmit={onSubmit}>
        <input type="text" placeholder="Name" />
        <input type="email" placeholder="Email" />
        <button type="submit">Submit</button>
      </form>
    );

    // 입력
    await user.type(screen.getByPlaceholderText('Name'), 'John');
    await user.type(screen.getByPlaceholderText('Email'), 'john@example.com');

    // 제출
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // 검증
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('should handle keyboard navigation', async () => {
    const { user } = render(
      <form>
        <input type="text" />
        <button>Submit</button>
      </form>
    );

    // Tab으로 포커스 이동
    await user.tab();
    expect(screen.getByRole('textbox')).toHaveFocus();

    // Tab으로 버튼으로 이동
    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();

    // Enter로 제출
    await user.keyboard('{Enter}');
  });
});
```

---

## 4. 비동기 테스트

### waitFor 패턴

```typescript
import { waitFor } from '@testing-library/react';

describe('Async Component', () => {
  it('should load data asynchronously', async () => {
    render(<UserList />);

    // 로딩 상태 확인
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // 데이터 로드 대기
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // 데이터 표시 확인
    expect(screen.getByText('User 1')).toBeInTheDocument();
  });

  it('should handle loading errors', async () => {
    const { rerender } = render(<Component initialState="error" />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### findBy 활용

```typescript
describe('Data Fetching', () => {
  it('should display fetched data', async () => {
    render(<UserProfile userId="1" />);

    // findBy로 비동기 대기
    const userName = await screen.findByText('John Doe');
    expect(userName).toBeInTheDocument();
  });

  it('should show error on fetch failure', async () => {
    // Mock fetch failure
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Network error'))
    );

    render(<UserProfile userId="1" />);

    const error = await screen.findByText(/error/i);
    expect(error).toBeInTheDocument();
  });
});
```

---

## 5. Mock & Stub

### Mock 함수

```typescript
import { vi } from 'vitest';

describe('Mocking', () => {
  it('should mock functions', () => {
    const mockFn = vi.fn();
    const mockFnWithReturn = vi.fn(() => 'mocked value');

    mockFn();
    mockFnWithReturn();

    expect(mockFn).toHaveBeenCalled();
    expect(mockFnWithReturn).toHaveReturnedWith('mocked value');
  });

  it('should mock async functions', async () => {
    const mockAsync = vi.fn(async () => ({ id: 1, name: 'John' }));

    const result = await mockAsync();

    expect(mockAsync).toHaveBeenCalled();
    expect(result).toEqual({ id: 1, name: 'John' });
  });

  it('should assert call arguments', () => {
    const mockFn = vi.fn();

    mockFn('arg1', { key: 'value' });

    expect(mockFn).toHaveBeenCalledWith('arg1', { key: 'value' });
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveReturnedWith(undefined);
  });
});
```

### Mock API 호출

```typescript
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock Server 설정
const server = setupServer(
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'John Doe',
      email: 'john@example.com',
    });
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: 1, ...body },
      { status: 201 }
    );
  })
);

// Setup/Teardown
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('API Integration', () => {
  it('should fetch user data', async () => {
    render(<UserProfile userId="1" />);

    const userName = await screen.findByText('John Doe');
    expect(userName).toBeInTheDocument();
  });

  it('should handle API errors', async () => {
    // 특정 요청에 대해 에러 반환
    server.use(
      http.get('/api/users/:id', () => {
        return HttpResponse.json({ error: 'Not found' }, { status: 404 });
      })
    );

    render(<UserProfile userId="999" />);

    const error = await screen.findByText(/error/i);
    expect(error).toBeInTheDocument();
  });
});
```

### Mock 모듈

```typescript
// api.ts
export async function fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};

// Component.test.tsx
import { vi } from 'vitest';
import * as api from './api';

// 모듈의 함수 mock
vi.spyOn(api, 'fetchUser').mockResolvedValue({
  id: '1',
  name: 'John',
});

describe('Component with API', () => {
  it('should call fetchUser with correct ID', async () => {
    render(<Component userId="1" />);

    await waitFor(() => {
      expect(api.fetchUser).toHaveBeenCalledWith('1');
    });
  });
});
```

---

## 6. 스냅샷 테스트

### 기본 사용

```typescript
describe('Snapshot Testing', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <Button variant="primary">Click</Button>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match snapshot with custom name', () => {
    render(<UserCard user={{ id: '1', name: 'John' }} />);

    expect(screen.getByText('John')).toMatchSnapshot('user-card-display');
  });
});
```

### 주의사항

```typescript
// ❌ 피하기 - 너무 크다
expect(screen.getByTestId('entire-page')).toMatchSnapshot();

// ✅ 좋음 - 작고 구체적
expect(screen.getByTestId('error-message')).toMatchSnapshot();
```

---

## 7. 훅 테스트

### renderHook 활용

```typescript
import { renderHook, act } from '@testing-library/react';

describe('useCounter Hook', () => {
  it('should initialize with correct value', () => {
    const { result } = renderHook(() => useCounter(10));

    expect(result.current.count).toBe(10);
  });

  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter(0));

    // act로 상태 업데이트 감싸기
    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should handle multiple updates', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.decrement();
    });

    expect(result.current.count).toBe(1);
  });
});
```

### useEffect 테스트

```typescript
describe('useUserData Hook', () => {
  it('should fetch data on mount', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: '1', name: 'John' }),
      })
    );
    global.fetch = mockFetch as any;

    const { result } = renderHook(() => useUserData('1'));

    // 초기 상태
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    // 데이터 로드 대기
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ id: '1', name: 'John' });
  });

  it('should refetch when dependency changes', async () => {
    const { result, rerender } = renderHook(
      ({ userId }) => useUserData(userId),
      { initialProps: { userId: '1' } }
    );

    // 첫 fetch 완료 대기
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Props 변경
    rerender({ userId: '2' });

    // 새 fetch 완료 대기
    await waitFor(() => {
      expect(result.current.data?.id).toBe('2');
    });
  });
});
```

---

## 8. Context & Provider 테스트

### Wrapper 컴포넌트

```typescript
describe('AuthContext', () => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should provide auth state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    expect(result.current.state.isAuthenticated).toBe(false);
    expect(result.current.state.user).toBeNull();
  });

  it('should handle login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    // Mock API
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: '1', name: 'John' }),
      })
    );

    act(() => {
      result.current.login('john@example.com', 'password');
    });

    await waitFor(() => {
      expect(result.current.state.isAuthenticated).toBe(true);
    });

    expect(result.current.state.user).toEqual({ id: '1', name: 'John' });
  });
});
```

---

## 9. 접근성 테스트

### 시맨틱 검사

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <button aria-label="Close">×</button>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper form labels', () => {
    render(
      <form>
        <label htmlFor="email">Email:</label>
        <input id="email" type="email" />
      </form>
    );

    // label이 input과 연결됨
    expect(screen.getByLabelText('Email:')).toBeInTheDocument();
  });

  it('should support keyboard navigation', async () => {
    const { user } = render(
      <div>
        <button>First</button>
        <button>Second</button>
        <button>Third</button>
      </div>
    );

    // Tab 네비게이션
    await user.tab();
    expect(screen.getByText('First')).toHaveFocus();

    await user.tab();
    expect(screen.getByText('Second')).toHaveFocus();
  });
});
```

---

## 10. E2E 테스트 (Playwright)

### 셋업

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E 테스트 작성

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should successfully login', async ({ page }) => {
    // 페이지 이동
    await page.goto('/login');

    // 요소 입력
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');

    // 버튼 클릭
    await page.click('button:has-text("Login")');

    // 리다이렉트 확인
    await expect(page).toHaveURL('/dashboard');

    // 대시보드 콘텐츠 확인
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrong');

    await page.click('button:has-text("Login")');

    // 에러 메시지 확인
    const error = page.locator('text=Invalid credentials');
    await expect(error).toBeVisible();
  });

  test('should persist session', async ({ page, context }) => {
    // 로그인
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Login")');
    await page.waitForURL('/dashboard');

    // 새 탭에서 대시보드 접근
    const page2 = await context.newPage();
    await page2.goto('/dashboard');

    // 로그인 상태 유지 확인
    await expect(page2.locator('text=Welcome')).toBeVisible();
  });
});
```

### Visual Regression 테스트

```typescript
test('should match screenshot', async ({ page }) => {
  await page.goto('/components/button');

  // 스냅샷 생성/비교
  await expect(page.locator('.button-showcase')).toHaveScreenshot();
});
```

---

## 11. 테스트 커버리지

### 커버리지 실행

```bash
# 모든 테스트 + 커버리지
yarn test --coverage

# 특정 파일만
yarn test Button --coverage

# Watch 모드
yarn test --watch --coverage
```

### 커버리지 목표

```typescript
// vitest.config.ts
test: {
  coverage: {
    all: true,
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
}
```

### 커버리지 분석

```typescript
// 커버리지 보고서 생성
yarn test --coverage --reporter=html

// 결과: coverage/index.html
```

---

## 12. Best Practices

### 테스트 작성 체크리스트

- [ ] 각 테스트는 1가지만 테스트
- [ ] 명확한 테스트 이름
- [ ] AAA 패턴 (Arrange, Act, Assert)
- [ ] Mock/Stub 최소한으로
- [ ] 실제 사용자 상호작용 시뮬레이션
- [ ] 구현이 아닌 동작 테스트
- [ ] 비동기 작업 properly await
- [ ] 메모리 누수 방지 (cleanup)

### 피해야 할 패턴

```typescript
// ❌ 테스트가 구현에 너무 의존
expect(component.state.isLoading).toBe(true);

// ✅ 사용자 관점에서 테스트
expect(screen.getByText('Loading...')).toBeInTheDocument();

// ❌ 너무 많은 것을 한 번에
it('should do everything', () => {
  // 10+ assertions
});

// ✅ 1가지만 테스트
it('should render button', () => {
  expect(screen.getByRole('button')).toBeInTheDocument();
});

// ❌ 시간에 의존
setTimeout(() => {
  expect(...).toBe(...);
}, 1000);

// ✅ waitFor 사용
await waitFor(() => {
  expect(...).toBe(...);
});
```

### 테스트 유지보수

```typescript
// 공통 테스트 유틸
export const renderWithProviders = (
  component: ReactElement,
  { route = '/', ...renderOptions } = {}
) => {
  window.history.pushState({}, 'Test page', route);

  return render(component, {
    wrapper: ({ children }) => (
      <AuthProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    ),
    ...renderOptions,
  });
};

// 사용
describe('Component', () => {
  it('should render', () => {
    renderWithProviders(<Component />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

---

## Test Template

### 최소 컴포넌트 테스트

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const { user } = render(<MyComponent />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    render(<MyComponent isError={true} />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

---

**Document Status**: Published
**Maintained by**: Frontend Team
**Last Review**: 2025-11-11
