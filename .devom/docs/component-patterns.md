# Frontend Component Patterns

> React에서 자주 사용하는 컴포넌트 패턴 모음

**Version**: 1.0
**Last Updated**: 2025-11-11

---

## 1. Compound Components Pattern

### 개요

관련된 컴포넌트들을 함께 사용하여 유연한 인터페이스를 제공합니다.

### 기본 예제: Menu 컴포넌트

```typescript
import { FC, ReactNode, createContext, useContext, useState } from 'react';

// Context 정의
interface MenuContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

// Hook
const useMenuContext = () {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenuContext must be used within Menu');
  }
  return context;
};

// Root 컴포넌트
interface MenuProps {
  children: ReactNode;
}

const Menu: FC<MenuProps> & {
  Trigger: typeof MenuTrigger;
  Content: typeof MenuContent;
  Item: typeof MenuItem;
} = ({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);

  return (
    <MenuContext.Provider value={{ isOpen, toggle, close }}>
      <div className="menu">{children}</div>
    </MenuContext.Provider>
  );
};

// Trigger 컴포넌트
interface MenuTriggerProps {
  children: ReactNode;
}

function MenuTrigger({ children }) {
  const { toggle } = useMenuContext();

  return (
    <button
      onClick={toggle}
      className="menu-trigger"
      aria-haspopup="menu"
      type="button"
    >
      {children}
    </button>
  );
};

// Content 컴포넌트
interface MenuContentProps {
  children: ReactNode;
}

function MenuContent({ children }) {
  const { isOpen, close } = useMenuContext();

  if (!isOpen) return null;

  return (
    <div className="menu-content" onClick={close}>
      {children}
    </div>
  );
};

// Item 컴포넌트
interface MenuItemProps {
  onClick?: () => void;
  children: ReactNode;
}

function MenuItem({ onClick, children }) {
  const { close } = useMenuContext();

  const handleClick = () {
    onClick?.();
    close();
  };

  return (
    <button className="menu-item" onClick={handleClick} type="button">
      {children}
    </button>
  );
};

// Export
Menu.Trigger = MenuTrigger;
Menu.Content = MenuContent;
Menu.Item = MenuItem;

export { Menu };
```

### 사용 예제

```typescript
import { Menu } from '@/components/Menu';

export function Navigation() {
  const handleLogout = () {
    console.log('Logging out...');
  };

  return (
    <Menu>
      <Menu.Trigger>
        <span>Menu</span>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item>Profile</Menu.Item>
        <Menu.Item>Settings</Menu.Item>
        <Menu.Item onClick={handleLogout}>Logout</Menu.Item>
      </Menu.Content>
    </Menu>
  );
};
```

### 장점
- ✅ 유연한 조합
- ✅ 명시적 인터페이스
- ✅ Context로 상태 공유
- ✅ 확장 가능

---

## 2. Render Props Pattern

### 개요

함수를 Props로 받아 렌더링 로직을 자식에게 위임합니다.

### 기본 예제: DataFetcher 컴포넌트

```typescript
import { FC, useEffect, useState, ReactNode } from 'react';

interface DataFetcherProps<T> {
  url: string;
  children: (state: DataFetcherState<T>) => ReactNode;
  onError?: (error: Error) => void;
}

interface DataFetcherState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const DataFetcher = <T,>({
  url,
  children,
  onError,
}: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = (await response.json()) as T;
      setData(json);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() {
    fetchData();
  }, [url]);

  return <>{children({ data, loading, error, refetch: fetchData })}</>;
};
```

### 사용 예제

```typescript
export function UserList() {
  return (
    <DataFetcher<User[]> url="/api/users">
      {({ data, loading, error, refetch }) => (
        <>
          {loading && <div>Loading...</div>}
          {error && (
            <div>
              <p>Error: {error.message}</p>
              <button onClick={refetch}>Retry</button>
            </div>
          )}
          {data && (
            <ul>
              {data.map(user => (
                <li key={user.id}>{user.name}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </DataFetcher>
  );
};
```

### 장점
- ✅ 렌더링 로직 유연함
- ✅ Props drilling 없음
- ✅ 재사용성 높음

### 단점
- ❌ JSX 중첩 깊어짐
- ❌ 디버깅 어려움

---

## 3. Higher-Order Component (HOC) Pattern

### 개요

컴포넌트를 받아 기능이 추가된 새 컴포넌트를 반환합니다.

### 기본 예제: withAuth HOC

```typescript
import { FC, ComponentType } from 'react';

interface WithAuthProps {
  isAuthenticated: boolean;
  user: User | null;
}

export const withAuth = <P extends WithAuthProps>(
  Component: ComponentType<P>
): FC<Omit<P, keyof WithAuthProps>> => {
  const WrappedComponent: FC<Omit<P, keyof WithAuthProps>> = props => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() {
      // 인증 상태 확인
      checkAuth().then(auth => {
        setIsAuthenticated(auth.isAuthenticated);
        setUser(auth.user);
      });
    }, []);

    if (!isAuthenticated) {
      return <div>Please log in</div>;
    }

    return (
      <Component
        {...(props as P)}
        isAuthenticated={isAuthenticated}
        user={user}
      />
    );
  };


  return WrappedComponent;
};

// 사용
interface ProtectedPageProps extends WithAuthProps {
  // ...
}

function ProtectedPage({ user }) {
  return <div>Welcome, {user?.name}!</div>;
};

export const ProtectedPageWithAuth = withAuth(ProtectedPage);
```

### 사용 예제

```typescript
// HOC 적용
const DashboardWithAuth = withAuth(Dashboard);

// 라우팅에서 사용
<Route path="/dashboard" element={<DashboardWithAuth />} />
```

### 장점
- ✅ 크로스커팅 관심사 분리
- ✅ Props 관리 중앙화
- ✅ 여러 HOC 조합 가능

### 단점
- ❌ Props naming 충돌
- ❌ Hooks 사용 불가

---

## 4. Custom Hooks Pattern

### 개요

상태 관리 로직을 재사용 가능한 훅으로 분리합니다.

### 예제 1: useForm Hook

```typescript
import { useState, useCallback, ChangeEvent, FormEvent } from 'react';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => void | Promise<void>;
  onError?: (errors: Record<string, string>) => void;
}

interface UseFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  reset: () => void;
  setFieldValue: (field: string, value: unknown) => void;
}

export const useForm = <T extends Record<string, unknown>>({
  initialValues,
  onSubmit,
  onError,
}: UseFormOptions<T>): UseFormReturn<T> => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setValues(prev => ({
      ...prev,
      [name]: fieldValue,
    }));

    // 입력 중 에러 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  }, [errors]);

  const handleBlur = useCallback((e: ChangeEvent<HTMLInputElement>) {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) {
      e.preventDefault();

      try {
        setIsSubmitting(true);
        await onSubmit(values);
      } catch (error) {
        const newErrors: Record<string, string> = {
          submit: error instanceof Error ? error.message : 'Submit failed',
        };
        setErrors(newErrors);
        onError?.(newErrors);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit, onError]
  );

  const reset = useCallback(() {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setFieldValue = useCallback((field: string, value: unknown) {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
  };
};
```

### useForm 사용 예제

```typescript
interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginForm() {
  const form = useForm<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
    },
    onSubmit: async values => {
      const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        type="email"
        name="email"
        value={form.values.email}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
      />
      {form.touched.email && form.errors.email && (
        <span>{form.errors.email}</span>
      )}

      <input
        type="password"
        name="password"
        value={form.values.password}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
      />
      {form.touched.password && form.errors.password && (
        <span>{form.errors.password}</span>
      )}

      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

### 예제 2: useLocalStorage Hook

```typescript
import { useState, useEffect, useCallback } from 'react';

interface UseLocalStorageOptions {
  serializer?: (value: unknown) => string;
  deserializer?: (value: string) => unknown;
}

interface UseLocalStorageReturn<T> {
  value: T | null;
  setValue: (value: T | ((prev: T | null) => T)) => void;
  remove: () => void;
}

export const useLocalStorage = <T,>(
  key: string,
  defaultValue?: T,
  options: UseLocalStorageOptions = {}
): UseLocalStorageReturn<T> => {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
  } = options;

  const [value, setValue] = useState<T | null>(() {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (deserializer(stored) as T) : (defaultValue ?? null);
    } catch {
      return defaultValue ?? null;
    }
  });

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T | null) => T)) {
      try {
        const valueToStore =
          typeof newValue === 'function'
            ? (newValue as (prev: T | null) => T)(value)
            : newValue;

        setValue(valueToStore);
        localStorage.setItem(key, serializer(valueToStore));
      } catch (error) {
        console.error(`Failed to set localStorage key "${key}":`, error);
      }
    },
    [key, value, serializer]
  );

  const remove = useCallback(() {
    try {
      localStorage.removeItem(key);
      setValue(null);
    } catch (error) {
      console.error(`Failed to remove localStorage key "${key}":`, error);
    }
  }, [key]);

  return { value, setValue: setStoredValue, remove };
};
```

### useLocalStorage 사용 예제

```typescript
export function ThemeSwitcher() {
  const { value: theme, setValue: setTheme } = useLocalStorage<'light' | 'dark'>(
    'theme',
    'light'
  );

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current: {theme}
    </button>
  );
};
```

---

## 5. Container/Presentational Pattern

### 개요

비즈니스 로직과 표현을 분리합니다.

### 예제: UserProfile

```typescript
// 1. Presentational Component (순수)
interface UserProfilePresentationProps {
  name: string;
  email: string;
  avatar: string;
  isLoading: boolean;
  error?: string;
  onEditClick: () => void;
}

function UserProfilePresentation({
  name,
  email,
  avatar,
  isLoading,
  error,
  onEditClick,
}) {
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="user-profile">
      <img src={avatar} alt={name} />
      <h2>{name}</h2>
      <p>{email}</p>
      <button onClick={onEditClick}>Edit</button>
    </div>
  );
};

// 2. Container Component (로직)
interface UserProfileContainerProps {
  userId: string;
}

function UserProfileContainer({ userId }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() {
    const fetchUser = async () {
      try {
        const response = await fetch(`/api/users/${userId}`);
        const data = (await response.json()) as User;
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleEdit = () {
    // Edit 로직
  };

  return (
    <UserProfilePresentation
      name={user?.name || ''}
      email={user?.email || ''}
      avatar={user?.avatar || ''}
      isLoading={loading}
      error={error}
      onEditClick={handleEdit}
    />
  );
};

export { UserProfileContainer as UserProfile };
```

### 장점
- ✅ 관심사 분리
- ✅ 테스트 용이
- ✅ 재사용성

---

## 6. Controlled vs Uncontrolled Components

### Controlled Component (권장)

```typescript
import { useState, ChangeEvent, FC } from 'react';

interface ControlledInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}

function ControlledInput({
  value,
  onChange,
  onSubmit,
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          onSubmit(value);
        }
      }}
    />
  );
};

// 사용
export function SearchBox() {
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) {
    setQuery(value);
  };

  return (
    <ControlledInput
      value={query}
      onChange={handleSearch}
      onSubmit={query => console.log('Search:', query)}
    />
  );
};
```

### Uncontrolled Component (특수한 경우)

```typescript
import { useRef, FC } from 'react';

const UncontrolledInput: FC = () {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () {
    console.log('Value:', inputRef.current?.value);
  };

  return (
    <>
      <input ref={inputRef} defaultValue="Default value" />
      <button onClick={handleSubmit}>Submit</button>
    </>
  );
};
```

### 비교

| 측면 | Controlled | Uncontrolled |
|------|-----------|-------------|
| 상태 관리 | React | DOM |
| 테스트 | 쉬움 | 어려움 |
| 성능 | 경미한 오버헤드 | 더 빠름 |
| 사용처 | 대부분의 경우 | File input, 드문 경우 |

---

## 7. Context + useReducer Pattern

### 개요

복잡한 상태 관리를 위해 Context와 useReducer를 조합합니다.

### 예제: Authentication Context

```typescript
import {
  FC,
  ReactNode,
  createContext,
  useContext,
  useReducer,
  useCallback,
} from 'react';

// Types
interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN' };

// Context
interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Reducer
const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGIN_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGOUT':
      return initialState;
    default:
      return state;
  }
};

// Provider
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback(async (email: string, password: string) {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const user = (await response.json()) as User;
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'LOGIN_ERROR', payload: message });
      throw error;
    }
  }, []);

  const logout = useCallback(() {
    dispatch({ type: 'LOGOUT' });
  }, []);

  const value: AuthContextType = {
    state,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 사용 예제

```typescript
export function LoginPage() {
  const { state, login } = useAuth();

  const handleLogin = async (email: string, password: string) {
    try {
      await login(email, password);
      // 로그인 성공
    } catch (error) {
      // 에러 처리
    }
  };

  if (state.isLoading) return <div>Logging in...</div>;

  return (
    <>
      {state.error && <div className="error">{state.error}</div>}
      <LoginForm onSubmit={handleLogin} />
    </>
  );
};
```

---

## 8. Slots Pattern (Vue의 Slot 같은 패턴)

### 개요

컴포넌트에 여러 위치에 콘텐츠를 삽입할 수 있게 합니다.

### 예제: Modal 컴포넌트

```typescript
import { FC, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  header?: ReactNode;
  body: ReactNode;
  footer?: ReactNode;
  closeButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  header,
  body,
  footer,
  closeButton = true,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {header && <div className="modal-header">{header}</div>}

        <div className="modal-body">{body}</div>

        {footer && <div className="modal-footer">{footer}</div>}

        {closeButton && (
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
```

### 사용 예제

```typescript
export function ConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Dialog</button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        header={<h2>Confirm Action</h2>}
        body={<p>Are you sure?</p>}
        footer={
          <div>
            <button onClick={() => setIsOpen(false)}>Cancel</button>
            <button onClick={() => setIsOpen(false)}>Confirm</button>
          </div>
        }
      />
    </>
  );
};
```

---

## 9. Lazy Loading & Code Splitting

### 기본 패턴

```typescript
import { FC, Suspense, lazy } from 'react';

// 동적 import로 코드 분할
const HeavyComponent = lazy(() =>
  import('./HeavyComponent').then(module => ({
    default: module.HeavyComponent,
  }))
);

export function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
};
```

### 라우트 기반 분할

```typescript
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

export function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
```

---

## 10. Portal Pattern

### 개요

컴포넌트를 DOM 트리 외부에 렌더링합니다.

### 예제: Toast Notification

```typescript
import { FC, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export function Toast({ message, type, onClose }) {
  return createPortal(
    <div className={`toast toast--${type}`}>
      <p>{message}</p>
      <button onClick={onClose} aria-label="Close">
        ×
      </button>
    </div>,
    document.getElementById('toast-root') || document.body
  );
};
```

### 사용 예제

```typescript
import { useState } from 'react';

export function MyComponent() {
  const [toast, setToast] = useState<string | null>(null);

  return (
    <>
      <button
        onClick={() {
          setToast('Success!');
          setTimeout(() => setToast(null), 3000);
        }}
      >
        Show Toast
      </button>

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </>
  );
};
```

---

## Pattern Selection Guide

### 언제 어떤 패턴을 쓸까?

| 상황 | 패턴 | 이유 |
|------|------|------|
| 관련 컴포넌트 조합 | Compound | 유연함 |
| 복잡한 조건부 렌더링 | Render Props | 제어권 반환 |
| 상태 공유 (작음) | Custom Hook | 간단함 |
| 상태 공유 (복잡함) | Context + Reducer | 강력함 |
| 로직과 UI 분리 | Container/Presentational | 테스트 가능 |
| 여러 위치 콘텐츠 | Slots | 유연함 |
| 성능 중요 | Code Splitting + Lazy | 최적화 |
| Modal/Tooltip | Portal | DOM 분리 |

---

**Document Status**: Published
**Maintained by**: Frontend Team
**Last Review**: 2025-11-11
