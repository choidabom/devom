# CONVENTION.md

**Frontend Code Convention (Next.js 16 + React 19 + TypeScript 5 + Shadcn UI)**

---

## 1. 기본 원칙 (Key Principles)

- 모든 코드는 **간결하고 일관된 기술적 표현**을 사용한다.
- **함수형, 선언형 프로그래밍**을 우선한다.
- **반복보다 모듈화**, **중복보다 명시성**을 선호한다.
- 변수명은 **의미 있고 동사형 보조어를 포함**한다. (`isLoading`, `hasError` 등)
- 훅 이름은 "use" 접두사를 사용한다. (`hooks/useProduct`)
- 컴포넌트는 **named export**를 사용한다. (`export function Component() {}`)
  - 예외: 일부 레거시 컴포넌트는 `export default`를 사용할 수 있으나 점진적으로 named export로 마이그레이션한다.
- 함수 설계 시 **RORO (Receive an Object, Return an Object)** 패턴을 사용한다.

---

## 2. JavaScript / TypeScript

- **순수 함수**는 반드시 `function` 키워드를 사용한다.
- **서비스 레이어(API)는 class를 사용**하여 관련 메서드를 그룹화한다.
  - static 메서드로 구성하여 인스턴스 생성 없이 사용한다.
  - 관련된 API 호출을 논리적으로 묶어 네임스페이스 역할을 한다.
  ```tsx
  // lib/api/userService.ts
  export class UserService {
    public static async getUser(id: number) {
      const { data } = await baseApi.get(`/users/${id}`)
      return data
    }
  }
  ```
- 모든 코드는 **TypeScript**로 작성한다.
- `interface`를 우선 사용하고, `type`은 복합 타입용으로만 사용한다.
- enum은 금지하고 **객체 리터럴 또는 Record 타입**으로 대체한다.
  ```tsx
  const USER_ROLE = {
    ADMIN: "admin",
    USER: "user",
  } as const
  ```
- 불필요한 중괄호(`{}`)는 피하고, 단일 조건문은 한 줄로 작성한다.
- **Import 순서**는 다음 규칙을 따른다:
  - `"use client"` 또는 `"use server"` 지시어가 있는 경우, 지시어 다음 한 줄을 띄우고 import 문을 작성한다.

  ```tsx
  "use client"

  // 1. 외부 라이브러리
  import { useState } from "react"
  import { useRouter } from "next/navigation"
  import { useQuery } from "@tanstack/react-query"

  // 2. 내부 절대 경로 (@/)
  import { Button } from "@/components/ui/button"
  import { useUser } from "@/hooks/useUser"
  ```

- 파일 구조는 다음 순서를 따른다:

  ```
  1. Exported Component (interface를 컴포넌트 바로 위에 배치)
  2. Subcomponents (각 컴포넌트의 interface를 해당 컴포넌트 바로 위에 배치)
  3. Helpers
  ```

- 불필요한 세미콜론(`;`)은 사용하지 않는다.

---

## 3. 에러 처리 및 검증 (Error Handling & Validation)

- 모든 함수는 **초반부에 에러 및 엣지 케이스를 처리**한다.
- 중첩된 `if` 대신 **early return**을 사용한다.
- 성공(해피패스)은 **함수의 마지막**에 위치한다.
- `if-return` 패턴을 사용하고 `else`를 최소화한다.
- **Guard Clause**로 전제 조건을 선제적으로 차단한다.
- 예외는 사용자 친화적 메시지로 변환하여 던진다.
- 예측 가능한 에러는 `try/catch`로 처리하지 않고, **모델링된 반환값**으로 처리한다.
- 예상치 못한 에러는 `error.tsx`, `global-error.tsx`에서 처리한다.
- `services/` 내부 코드는 항상 사용자 친화적인 에러를 던지고, **TanStack Query**에서 이 에러를 캐치해 UI로 전달한다.

---

## 4. React / Next.js

- 모든 컴포넌트는 **함수형 컴포넌트**로 작성한다. (`function Component() {}`)
- 선언형 JSX를 사용한다.
- `use client`, `useEffect`, `setState` 사용을 최소화한다.
- **RSC(Server Component)**를 기본으로 사용하고, 클라이언트 전용 기능(Web API 등)만 `use client`로 분리한다.
- **zod (v3.22+)**를 사용해 입력 데이터를 검증한다.
- **react-hook-form + useActionState** 조합으로 폼 유효성 검사를 수행한다.
- **Suspense + fallback**으로 클라이언트 컴포넌트를 감싼다.
- 비핵심 컴포넌트는 **dynamic import**로 지연 로드한다.
- 이미지는 **WebP 포맷**, **lazy loading**, **size 지정**을 사용한다.
- **React API는 직접 import**하여 사용하고, `React.` 네임스페이스 사용을 금지한다.

  ```tsx
  // ❌ 잘못된 사용
  import React from "react"
  React.memo(Component)
  React.useCallback(() => {}, [])

  // ✅ 올바른 사용
  import { memo, useCallback } from "react"
  memo(Component)
  useCallback(() => {}, [])
  ```

---

## 5. 폴더 구조 (Directory Structure)

```
src/
├── app/                   # Next.js App Router
├── components/            # Shared/common components
│   └── ui/                # shadcn/ui components
├── hooks/                 # Shared/common hooks
├── utils/                 # Shared/common utils
├── context/               # React Context Providers
├── lib/                   # Library configurations
├── data/                  # Static data
├── constants/             # Constants
├── styles/                # Global styles
├── types/                 # TypeScript types
└── middleware.ts
```

---

## 6. 코드 일관성 (Readability & Predictability)

### **명명된 조건 변수**

- 복잡한 조건문은 명명된 불리언 변수로 분리한다.

```tsx
const isPriceInRange = price >= min && price <= max
if (isPriceInRange) addToList()
```

---

## 7. 조건부 렌더링 (Conditional Rendering)

- UI 조건이 크게 다를 경우 **별도 컴포넌트로 분리**한다.

```tsx
function SubmitButton() {
  const isViewer = useRole() === "viewer"
  return isViewer ? <ViewerSubmitButton /> : <AdminSubmitButton />
}
```

---

## 8. 폼 구조 (Form Cohesion)

### **Form-Level (폼 단위형)**

- Zod 스키마로 전체 폼 검증.

```tsx
const schema = z.object({ name: z.string(), email: z.string().email() })
useForm({ resolver: zodResolver(schema) })
```

---

## 9. 결합도 최소화 (Coupling)

- **조기 추상화 금지**: 사용처가 분기될 가능성이 있으면 중복 허용.
- **State 범위 최소화**: hook은 필요한 상태만 관리하도록 세분화.
- **Props Drilling 방지**: Composition을 사용해 중간 컴포넌트 제거.

```tsx
function ItemEditModal({ open, items, onClose }) {
  const [keyword, setKeyword] = useState("")
  return (
    <Modal open={open} onClose={onClose}>
      <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      <ItemEditList keyword={keyword} items={items} />
    </Modal>
  )
}
```

---

## 10. 응집도 (Cohesion)

- 관련된 로직과 타입은 **근접하게 배치**한다. (interface를 컴포넌트 바로 위에)
- 모든 유틸은 목적에 맞는 디렉토리에 위치해야 한다.

---

## 11. 퍼포먼스 및 접근성

- **Web Vitals(LCP, CLS, FID)**를 우선 고려한다.
- **모바일 퍼스트** 접근으로 Tailwind 반응형 설계.
- **Tailwind Aria** 및 **Radix UI**를 통한 접근성 강화.
- 불필요한 리렌더 방지를 위해 **state slice** 최소화.

---

## 12. UI 구성요소

- UI 구성요소는 **Shadcn UI** + **Radix Primitives**로 구성한다.
- Tailwind CSS로 빠른 커스터마이징을 적용한다.
- 모든 버튼, 입력, 모달 등은 **일관된 인터페이스**를 사용한다.

---

## 13. 예시 구조 (Component Example)

```tsx
// components/userProfileCard.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"

interface UserProfileCardProps {
  user: { name: string; image: string }
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  if (!user) return null
  return (
    <Card>
      <CardContent>
        <Avatar src={user.image} alt={user.name} />
        <p>{user.name}</p>
      </CardContent>
    </Card>
  )
}

interface UserAvatarProps {
  imageUrl: string
  name: string
}

function UserAvatar({ imageUrl, name }: UserAvatarProps) {
  return <Avatar src={imageUrl} alt={name} />
}

function formatUserName(name: string): string {
  return name.trim().toUpperCase()
}
```

**파일 구조 설명:**

1. **Imports**: 외부 모듈 import
2. **Main Component**: interface를 컴포넌트 바로 위에 배치
3. **Subcomponents**: 각 서브 컴포넌트의 interface를 해당 컴포넌트 바로 위에 배치
4. **Helpers**: 순수 함수들

---

## 14. 참고 링크

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [React Docs](https://react.dev/)
- [TanStack Query Docs](https://tanstack.com/query)
- [Shadcn UI](https://ui.shadcn.com/)
- [Radix Primitives](https://www.radix-ui.com/)
