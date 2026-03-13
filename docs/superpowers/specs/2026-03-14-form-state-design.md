# Form State Management Design Spec

## Overview

에디터에 폼 상태 관리 기능을 추가하여, Interaction 모드에서 실제 동작하는 폼 프로토타이핑과 react-hook-form + zod 코드 export를 지원한다.

## Goals

1. **Interaction 모드 프로토타이핑** — 폼을 채우고 submit하면 validation + toast 결과 표시
2. **Form Code Export** — react-hook-form + zod 스키마가 포함된 완전한 React 폼 코드 생성
3. **확장 가능한 구조** — 나중에 비폼 컴포넌트 상태(Accordion, Tabs 등)를 추가할 수 있는 모델

## Decisions

| 항목 | 결정 |
|---|---|
| 시나리오 | 에디터 프로토타이핑 + export 둘 다 |
| 범위 | 단일 폼 (다중 폼은 독립 동작, 폼 간 연동 없음) |
| Submit 동작 | Canvas에 toast/alert로 결과 JSON 표시 |
| Validation 에러 | 필드 하단 에러 메시지 (FormMessage 스타일) |
| 대상 컴포넌트 | 8개 (Input, Textarea, Checkbox, Switch, Select, RadioGroup, Slider, Button) |
| 접근 방식 | Element-level formField 속성 (접근 A) |

---

## 1. Data Model

### 1.1 New Types

```typescript
interface FormFieldConfig {
  name: string                    // 폼 필드명 ("email", "password")
  defaultValue?: unknown          // 초기값
  validation?: ValidationRule     // 검증 규칙
}

interface ValidationRule {
  required?: boolean | string     // true 또는 커스텀 에러 메시지
  min?: number                    // 최소값/최소길이
  max?: number                    // 최대값/최대길이
  pattern?: string | 'email' | 'url'  // 프리셋 키워드 또는 커스텀 정규식
  message?: string                // 기본 에러 메시지
}
```

### 1.2 EditorElement Extension

```typescript
interface EditorElement {
  // ...기존 필드
  formField?: FormFieldConfig     // 폼 필드인 경우에만 존재
}
```

### 1.3 New ElementType

```typescript
type ElementType = ... | 'form'
```

`form` 타입 요소:
- 자식으로 폼 필드 컴포넌트를 가짐
- `layoutMode: 'flex'`로 기본 생성 (세로 정렬)
- Canvas에서 `<form>` 태그로 렌더링
- Interaction 모드에서 submit 이벤트 처리

### 1.4 Button formRole

Button의 props에 `formRole` 추가:

```typescript
props: {
  // ...기존 (variant, size, label)
  formRole?: 'submit' | 'reset'
}
```

---

## 2. PropertiesPanel

### 2.1 Form Field Section

폼 대상 8개 컴포넌트 선택 시 PropertiesPanel에 "Form Field" 섹션 표시:

```
┌─ Properties Panel ──────────┐
│ Style (기존)                 │
│ Component Props (기존)       │
│ ─────────────────────────── │
│ Form Field           [토글] │
│  Name:    [email     ]      │
│  Default: [          ]      │
│  ─── Validation ─────────── │
│  Required          [✓]     │
│  Min Length:  [    ]        │
│  Max Length:  [    ]        │
│  Pattern:    [    ]        │
│  Error Msg:  [    ]        │
└─────────────────────────────┘
```

- **토글 ON**: `formField = { name: autoGenerateName() }` 생성 (예: `input_1`, `checkbox_2`)
- **토글 OFF**: `formField = undefined`
- **Name 중복 경고**: 같은 Form 내 중복 name 시 경고 표시
- **컴포넌트별 validation 항목**:
  - Input/Textarea: required, min, max, pattern
  - Checkbox/Switch: required만
  - Select/RadioGroup: required만
  - Slider: min, max
  - Button: validation 없음 (formRole만)

### 2.2 Form Container Selection

```
┌─ Properties Panel ──────────┐
│ Form Settings                │
│  Name:  [loginForm   ]      │
│  Fields: 3 fields            │
│  [Preview Schema]            │
└─────────────────────────────┘
```

- Form 이름은 export 시 함수명으로 사용
- Preview Schema 버튼으로 zod 스키마 미리보기

---

## 3. Canvas — Interaction Mode

### 3.1 Form State Architecture

폼 런타임 상태는 Canvas 내부에서만 관리. DocumentStore에 저장하지 않음.

```
DocumentStore (Shell)          Canvas (iframe)
┌──────────────┐              ┌──────────────────┐
│ formField: {  │  ──SYNC──>  │ formState: {      │
│   name,       │              │   email: "a@b.c", │
│   defaultValue│              │   agree: true,    │
│   validation  │              │ }                 │
│ }             │              │ formErrors: {     │
└──────────────┘              │   email: null,    │
                               │   agree: "필수",   │
                               │ }                 │
                               └──────────────────┘
```

**이유**: 사용자 입력값은 "디자인 데이터"가 아니라 "프로토타이핑 데이터". DocumentStore에 넣으면 undo/redo 히스토리가 오염됨.

### 3.2 Interaction Mode Flow

1. **모드 진입** (P키) — form 요소를 찾아서 formState를 defaultValue들로 초기화
2. **필드 입력** — 각 컴포넌트의 onChange가 formState 업데이트
3. **Submit 클릭** — validation 실행:
   - 통과: toast로 formState JSON 표시
   - 실패: 각 필드 하단에 에러 메시지 표시
4. **Reset 클릭** — formState를 defaultValue로 초기화, 에러 클리어
5. **모드 나감** (V키/ESC) — formState 폐기

### 3.3 Validation Engine

Canvas 내부에서 간단한 if 로직으로 실행 (zod 런타임 아님 — Canvas 번들 사이즈 최소화):

```typescript
function validateField(value: unknown, rule: ValidationRule): string | null {
  if (rule.required && !value) return typeof rule.required === 'string' ? rule.required : (rule.message || "필수 항목입니다")
  if (rule.min != null && typeof value === 'string' && value.length < rule.min) return `최소 ${rule.min}자`
  if (rule.min != null && typeof value === 'number' && value < rule.min) return `최소 ${rule.min}`
  if (rule.max != null && typeof value === 'string' && value.length > rule.max) return `최대 ${rule.max}자`
  if (rule.max != null && typeof value === 'number' && value > rule.max) return `최대 ${rule.max}`
  if (rule.pattern && !new RegExp(rule.pattern).test(String(value))) return rule.message || "형식이 올바르지 않습니다"
  return null
}
```

### 3.4 Error Message Display

Interaction 모드에서 formField가 있는 컴포넌트 아래에 에러 텍스트 렌더링:

```tsx
{formError && (
  <p style={{ color: 'hsl(0 84% 60%)', fontSize: 12, marginTop: 4 }}>
    {formError}
  </p>
)}
```

---

## 4. Export — Form Code Tab

### 4.1 ExportModal Extension

ExportModal에 "Form Code" 탭 추가 (form 요소가 문서에 있을 때만 활성화):

```
[HTML] [JSX] [Form Code] [JSON]
```

### 4.2 Generated Code Structure

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
  email: z.string().min(1, "필수 항목입니다").email("이메일 형식이 아닙니다"),
  password: z.string().min(8, "최소 8자"),
  agree: z.boolean().refine(v => v, "동의가 필요합니다"),
})

export function LoginForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "", agree: false },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### 4.3 ValidationRule → zod Conversion

| ValidationRule | zod 코드 |
|---|---|
| `required: true` | `.min(1, "필수")` (string) / `.refine(v => v, "필수")` (boolean) |
| `required: "커스텀"` | `.min(1, "커스텀")` |
| `min: 3` | `.min(3)` (string: 길이, number: 값) |
| `max: 100` | `.max(100)` |
| `pattern: "^\\S+@"` | `.regex(/^\S+@/, "형식 오류")` |
| `pattern: "email"` | `.email("이메일 형식이 아닙니다")` |
| `pattern: "url"` | `.url("URL 형식이 아닙니다")` |

### 4.4 Component Field Binding

| 컴포넌트 | zod base type | 바인딩 패턴 |
|---|---|---|
| Input | `z.string()` | `{...field}` |
| Textarea | `z.string()` | `{...field}` |
| Checkbox | `z.boolean()` | `checked={field.value} onCheckedChange={field.onChange}` |
| Switch | `z.boolean()` | `checked={field.value} onCheckedChange={field.onChange}` |
| Select | `z.string()` | `onValueChange={field.onChange} value={field.value}` |
| RadioGroup | `z.string()` | `onValueChange={field.onChange} value={field.value}` |
| Slider | `z.number()` | `value={[field.value]} onValueChange={v => field.onChange(v[0])}` |

### 4.5 Existing Exports Unchanged

HTML/JSX/JSON 탭은 현재 동작 유지. Form Code는 별도 탭.

---

## 5. Message Protocol

### 5.1 New Messages

```typescript
// Shell → Canvas: Interaction 모드 진입 시 form 필드 정보 전달
| { type: 'SET_INTERACTION_FORM_STATE'; formId: string; fields: FormFieldRuntime[] }

// Canvas → Shell: submit 성공 시 결과 알림
| { type: 'FORM_SUBMIT_RESULT'; formId: string; values: Record<string, unknown> }
```

`FormFieldRuntime`:
```typescript
interface FormFieldRuntime {
  elementId: string
  name: string
  defaultValue: unknown
  validation?: ValidationRule
}
```

**최소한으로 유지**: 폼 런타임 상태는 Canvas 내부 관리. 필드 입력마다 메시지 전송 없음. 기존 SYNC_DOCUMENT로 formField 설정은 이미 전달됨.

---

## 6. Toolbar

### 6.1 Form Dropdown

```
기존: [Frame] [Text] [Image] [UI ▾] [Sections ▾] ...
변경: [Frame] [Text] [Image] [UI ▾] [Form ▾] [Sections ▾] ...
```

Form 드롭다운 항목:
- Form Container
- ── Fields ──
- Input
- Textarea
- Checkbox
- Switch
- Select
- RadioGroup
- Slider
- Submit Button

### 6.2 DnD Behavior

- Form 드롭다운에서 드래그 시: form 컨테이너가 없으면 자동 생성 후 그 안에 필드 추가
- form 컨테이너가 있으면: 기존 form 자식으로 추가
- 각 필드는 `formField: { name: autoName() }` 포함하여 생성

### 6.3 UI Dropdown과의 관계

- **UI 드롭다운**: formField 없이 생성 (순수 UI 컴포넌트)
- **Form 드롭다운**: formField 포함하여 생성 (폼 필드)
- PropertiesPanel Form Field 토글로 언제든 전환 가능

---

## 7. Edge Cases

### 7.1 Field Lifecycle

- **필드 삭제**: formField 속성과 함께 삭제됨. Interaction 모드 중 삭제 시, 다음 Edit→Interact 전환에서 SET_INTERACTION_FORM_STATE 재전송으로 Canvas formState 갱신
- **필드를 form 밖으로 이동**: formField 속성 유지 (orphaned). Interaction 모드에서 validation/submit에 포함되지 않음 (form 컨테이너 자손만 수집)
- **필드 복제 (Cmd+D)**: name에 `_copy` 접미사 자동 추가. 충돌 시 `_copy2`, `_copy3` 증가
- **form 컨테이너 삭제**: 자식 요소도 함께 삭제 (기존 동작). formField 속성은 자식과 함께 소멸

### 7.2 Multi-Form

- 필드 name 유일성은 **form 단위로 스코핑**. 서로 다른 form에 같은 name 허용
- Export 시 각 form별로 별도 함수 생성 (LoginForm, SignupForm 등)
- Interaction 모드에서 각 form 독립 동작 (별도 formState)

### 7.3 Select/RadioGroup Options

- options는 기존 `props.options` (또는 `props.items`) 필드 사용 — FormFieldConfig에 중복 저장하지 않음
- Export 시 `props.options`에서 읽어서 `<SelectItem>` / `<RadioGroupItem>` 생성

### 7.4 Button formRole Outside Form

- form 컨테이너 밖의 Button은 formRole 무시 (일반 버튼 동작)
- PropertiesPanel에서 formRole은 form 자손일 때만 표시

### 7.5 Slider Validation vs Component Props

- `validation.min/max`: validation 범위 (FormMessage 에러 표시)
- `props.min/max`: UI 바운드 (슬라이더 트랙 한계)
- 보통 일치해야 하지만 독립적으로 설정 가능

---

## 8. Scope — Out of Scope

- 다중 폼 간 연동
- 비폼 컴포넌트 상태 (Accordion, Tabs)
- 서버 액션/API 연동 (onSubmit은 console.log까지)
- 조건부 렌더링 (필드 A 값에 따라 필드 B 표시/숨김)
- 동적 폼 (배열 필드 추가/삭제)
- FormMessage 커스텀 스타일링
- Canvas에 zod 런타임 포함

## 9. Affected Packages

| 패키지 | 변경 내용 |
|---|---|
| `packages/editor-core` | types.ts (FormFieldConfig, ValidationRule, form ElementType), DocumentStore, export 모듈 (formCodeExport.ts 추가), protocol 메시지 |
| `apps/editor-shell` | PropertiesPanel (Form Field 섹션), Toolbar (Form 드롭다운), ExportModal (Form Code 탭) |
| `apps/editor-canvas` | ElementRenderer (form 렌더링), form 런타임 로직 (formState, validation, toast, 에러 메시지) |
