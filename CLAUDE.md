# Devom Development Kit (DDK) v4.0 - Frontend Edition

> Epic-Driven Development System for React/TypeScript Monorepo

**Quick Links**: [Reading Guide](.devom/docs/READING_GUIDE.md) | [Detailed Docs](.devom/docs/) | [Epics](.devom/epics/)

---

## ⚡ Quick Start

### 1 Epic = 1 Branch (ABSOLUTE RULE)

```
Epic → Branch (feature/EPIC-{ulid}) → Tasks → Test → Review → Commit
```

### Absolute Prohibitions

- ❌ No Task-based branches
- ❌ No changes without Epic
- ❌ No code without typecheck passing
- ❌ No commits to main/master
- ❌ **No skipping code review** (review required for EVERY Task, regardless of duration)

**✅ Always**: Epic first → Task unit implementation → Code review (MANDATORY)

---

## 📋 Core Workflow Diagram

```
1. Write Epic (.devom/epics/EPIC-{ulid}/EPIC.md)
   ↓
2. Create Branch (feature/EPIC-{ulid})
   ↓
3. TASK 1 START
   ├─ Implement components (parallel via component-writer)
   ├─ Implement hooks (parallel via hook-writer)
   ├─ Write tests (parallel via component-writer)
   ├─ Write stories (parallel via storybook-writer)
   ├─ Validate: yarn test && npx tsc
   └─ Code Review (parallel via code-reviewer)
   ↓
4. TASK 2 START (if needed)
   └─ Same as Task 1
   ↓
5. All Tasks Complete
   ├─ All tests passing
   ├─ No typecheck errors
   ├─ All stories documented
   └─ All reviews approved
   ↓
6. Commit & PR
   ↓
7. Update Component Documentation
   ├─ Copy EPIC.md to component docs location
   │  └─ e.g., packages/ui/src/Button/docs/EPIC.md
   └─ Update existing docs if present
   ↓
8. Epic Complete
```

---

## 🎯 Core Rules & Standards

### Task Structure

| Aspect | Standard | Notes |
|--------|----------|-------|
| **Files per Task** | 1-3 files | Split if more |
| **Max Tokens** | ~140K | 70% of session max |
| **Duration** | 15-30 min | Adjust Task size |
| **Test Coverage** | 80%+ | Per Task requirement |

### File Naming Pattern

| Type | Pattern | Example | Exports |
|------|---------|---------|---------|
| Component | `{Name}.tsx` | `Button.tsx` | YES |
| Props Types | `{Name}.types.ts` | `Button.types.ts` | YES |
| Styles | `{name}.module.css` | `button.module.css` | NO (CSS Modules) |
| Hook | `use{Name}.ts` | `useUserData.ts` | YES |
| Test | `{file}.test.tsx` | `Button.test.tsx` | NO |
| Stories | `{Name}.stories.tsx` | `Button.stories.tsx` | NO |
| Public API | `index.ts` | `index.ts` | YES |

### Key Coding Rules (Checklist)

- [ ] **Components**: Max 200 lines
- [ ] **JSDoc**: @param, @returns required for props and return values
- [ ] **Props**: All props typed (no `any`)
- [ ] **Errors**: Descriptive error boundaries
- [ ] **Accessibility**: ARIA attributes, keyboard support
- [ ] **Types**: No `any`, all params/returns typed
- [ ] **Async**: async/await only (no .then chains)
- [ ] **Performance**: useCallback/useMemo for expensive operations
- [ ] **State**: Zustand for global state, useState for local
- [ ] **Styling**: CSS Modules or Tailwind (consistent per project)
- [ ] **Testing**: Vitest + React Testing Library
- [ ] **Naming**: camelCase (vars), PascalCase (components), UPPER_SNAKE_CASE (constants)

**Component Pattern** (CRITICAL):
```typescript
// ✅ CORRECT - Full type safety
import { FC } from 'react';
import type { ButtonProps } from './Button.types.js';
import styles from './button.module.css';

/**
 * Button component with accessibility support
 * @param props - Button properties
 * @returns Button element
 */
export const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  disabled = false,
  onClick,
  ...props
}) => {
  return (
    <button
      className={styles[variant]}
      disabled={disabled}
      onClick={onClick}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// ❌ WRONG - No types
export const Button = (props) => { ... }

// ❌ WRONG - Any type
export const Button: FC<any> = (props) => { ... }

// ❌ WRONG - No accessibility
<button onClick={onClick}>{children}</button>
```

**Hook Pattern** (CRITICAL):
```typescript
// ✅ CORRECT - Type-safe custom hook
import { useState, useEffect } from 'react';
import type { User } from './types.js';

/**
 * Custom hook to fetch user data
 * @param userId - User ID to fetch
 * @returns User data, loading state, and error
 */
export const useUserData = (userId: string) => {
  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch user ${userId}`);
        }
        const userData = await response.json();
        setData(userData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { data, loading, error };
};

// ❌ WRONG - No types
export const useUserData = (userId) => { ... }

// ❌ WRONG - Using .then chains
fetch().then().catch()  // Use async/await instead
```

See [Detailed Coding Rules](.devom/docs/coding-rules.md) and [Component Patterns](.devom/docs/component-patterns.md) for complete patterns.

### Epic Requirements

**Mandatory sections in EPIC.md**:
- Title, created date, version
- Overview (purpose & background)
- Functional requirements
- Technical requirements
- Task definitions with file lists
- Test strategy
- Success criteria

**File structure**:
```
.devom/epics/EPIC-{ulid}/
├── EPIC.md         # Main Epic document
├── task-1.md       # (Optional) Task 1 details
└── task-2.md       # (Optional) Task 2 details
```

**⚠️ IMPORTANT - Local Working Documents**:
- `.devom/epics/` is **LOCAL ONLY** (gitignored)
- These are working documents for development process
- **DO NOT commit** these to git repository
- Final documentation goes to component docs: `packages/{package}/src/{component}/docs/EPIC.md`
- Only exceptions: `README.md`, `TEMPLATE.md`, `.gitkeep` are tracked

### Epic Types

**Frontend Epic Template** (`.devom/templates/EPIC-TEMPLATE-FRONTEND.md`):
- **용도**: 전체 기능 개발 (Full Feature Development)
- **범위**: 라우팅 + API + 상태관리 + 레이아웃 + 네비게이션 + 권한
- **Phase 구조**:
  1. **Phase 1: Foundation** - API 타입 정의, React Query 훅
  2. **Phase 2: Components** - 재사용 가능한 UI 컴포넌트
  3. **Phase 3: Pages** - Next.js App Router 페이지 (page.tsx, layout.tsx, loading.tsx, error.tsx)
  4. **Phase 4: Integration** - 네비게이션 추가, 권한 체크, SEO 메타데이터
  5. **Phase 5: Testing & Optimization** - E2E 테스트, 성능 최적화, 접근성 검증

**언제 사용하는가?**
- ✅ 새로운 페이지 추가 (예: 사용자 대시보드, 상품 목록)
- ✅ 전체 사용자 플로우 구현 (예: 로그인 → 프로필 → 설정)
- ✅ API 연동이 필요한 기능
- ✅ 네비게이션/라우팅 변경이 필요한 경우

**공통 컴포넌트만 개발하는 경우**:
- Phase를 간소화하여 Phase 2 (Components) + Phase 5 (Testing)만 사용
- 템플릿에서 불필요한 Phase 제거하고 진행

See [Epic Template](.devom/templates/EPIC-TEMPLATE-FRONTEND.md) for complete format.

---

## 🤖 Agent Usage Quick Reference

### component-writer (Component Implementation)

**Role**: Apply React component code + run typecheck

**When to use**: Component & test files

**Key principle**: Self-Contained prompts (all info in prompt, no memory reads)

**What to include in prompt**:
1. File path (absolute)
2. Complete component code
3. Props type definitions
4. Style requirements
5. Accessibility requirements
6. Coding rules (key ones)
7. Test patterns (if test file)

**Parallel usage**: Up to 3 independent components per request

**Example**:
```
Task 1: component-writer - Button.tsx
Task 2: component-writer - Input.tsx
Task 3: component-writer - Modal.tsx
(All process simultaneously)
```

See [component-writer Templates](.devom/templates/task-prompts/) for examples.

### hook-writer (Custom Hook Implementation)

**Role**: Apply custom hook code + run typecheck

**When to use**: Custom React hooks (useXXX)

**Key principle**: Self-Contained prompts with all dependencies

**What to include in prompt**:
1. File path (absolute)
2. Complete hook code
3. Return type definitions
4. Dependencies
5. Error handling patterns
6. Test patterns

**Parallel usage**: Up to 3 independent hooks per request

### storybook-writer (Storybook Stories)

**Role**: Write Storybook stories for components

**When to use**: After component implementation

**Key principle**: Complete story with all variants

**What to include in prompt**:
1. Component file path
2. All props variations
3. Interactive controls
4. Documentation annotations

### code-reviewer (Code Review)

**Role**: Review code + provide feedback (no modifications)

**When to use**: After Task completion (tests + typecheck passing)

**Key principle**: Self-Contained prompts with inline review criteria

**Review checklist**:
- [ ] Coding rules compliance
- [ ] Component patterns (FC, props typing)
- [ ] Hook patterns (return types, dependencies)
- [ ] Accessibility (ARIA, keyboard)
- [ ] Performance (memoization, lazy loading)
- [ ] TypeScript type safety

**Parallel usage**: All changed files in one request

See [Code Review Guide](.devom/docs/code-review.md) for detailed process.

---

## 📝 Task Workflow Steps

### Before Starting Task

1. Read Epic for this Task
2. List all component files
3. List all hook files
4. List all test files
5. List all story files
6. Check dependencies from previous Task

### Step 1: Implement Components (Parallel)

**CRITICAL**: Write code that complies with lint/coding rules BEFORE sending to component-writer.

Send all components to component-writer in one request:

```typescript
// Prompt structure for each component:
파일 경로: packages/ui/src/Button/Button.tsx

구현할 코드:
[Complete React component code here - MUST follow coding rules below]

Props 타입 정의:
[ButtonProps interface with JSDoc]

스타일 요구사항:
[CSS Modules or Tailwind classes]

접근성 요구사항:
[ARIA attributes, keyboard support]

코딩 규칙 (핵심 - 코드에 반드시 적용):
- JSDoc 필수 (@param, @returns)
- All props typed (no any)
- ARIA attributes for accessibility
- useCallback/useMemo for performance
- Error boundaries for error handling
- .js extensions in imports
[... more rules as needed]
```

**Coding rules MUST be applied to the code you write, not just listed as requirements.**

### Step 2: Implement Hooks (Parallel)

After understanding component requirements:

```typescript
// Prompt structure for hooks:
파일 경로: packages/hooks/src/useUserData.ts

훅 구현 코드:
[Complete custom hook code]

반환 타입:
[Return type interface with JSDoc]

의존성:
[Dependencies and their types]

에러 처리:
[Error handling pattern]
```

### Step 3: Write Tests (Parallel)

After all implementation files complete:

```typescript
// Prompt structure for test files:
파일 경로: packages/ui/src/Button/Button.test.tsx

테스트 코드:
[Complete test code using Vitest + React Testing Library]

테스트 패턴 (AAA):
- Arrange: Render component with props
- Act: User interactions (click, type, etc.)
- Assert: Verify DOM changes and callbacks

Mock setup:
[Mock definitions for API calls, context, etc.]
```

See [Testing Patterns](.devom/docs/testing-patterns.md) for complete pattern reference.

### Step 4: Write Stories (Parallel)

After components are tested:

```typescript
// Prompt structure for story files:
파일 경로: packages/ui/src/Button/Button.stories.tsx

스토리 코드:
[Complete Storybook story with all variants]

스토리 구성:
- Default: 기본 상태
- Primary: primary variant
- Secondary: secondary variant
- Disabled: disabled 상태
- WithIcon: 아이콘 포함

Controls:
[Interactive controls for props]
```

### Step 5: Validate

```bash
yarn test          # All tests must pass
npx tsc --noEmit  # Zero TypeScript errors
yarn storybook     # (Optional) Visual check
```

### Step 6: Code Review (Parallel) **[MANDATORY - NO SKIP]**

**CRITICAL**: Code review is REQUIRED for every Task, regardless of time or complexity.

Send all changed files to code-reviewer:

```
Task 1: code-reviewer - Button.tsx
Task 2: code-reviewer - Button.types.ts
Task 3: code-reviewer - Button.test.tsx
Task 4: code-reviewer - Button.stories.tsx
```

**Never skip review because**:
- Task takes long time ❌
- Code seems simple ❌
- Time pressure ❌
- Tests passing ❌

**Always conduct review**:
- ✅ Every Task completion
- ✅ All changed files
- ✅ Parallel execution for speed

### Step 7: Next Task

If review passes → Task 2 (or Epic complete)
If issues found → Fix → Revalidate → Re-review

---

## 📊 Completion Checklist

### Task Complete When

- [ ] All component files done
- [ ] All hook files done
- [ ] All test files done
- [ ] All story files done
- [ ] `yarn test` passes (all tests)
- [ ] `npx tsc --noEmit` passes
- [ ] Code review approved (no FAIL status)

### Epic Complete When

- [ ] All Tasks complete
- [ ] All tests passing (cumulative)
- [ ] No TypeScript errors
- [ ] All coding rules followed
- [ ] Success criteria met
- [ ] All stories documented

### Git Commit (After All Tasks)

```bash
git add .
git commit -m "feat: [feature description]

- Task 1: [accomplishment]
- Task 2: [accomplishment]
- Tests: all passing
- TypeScript: strict mode compliant
- Storybook: all variants documented

Epic: .devom/epics/EPIC-{ulid}/EPIC.md

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 💡 Self-Contained Prompt Philosophy

**What**: Prompts contain ALL needed information
**Why**: Faster execution, no file reads, no memory lookups
**How**: Include code, types, dependencies, rules inline

**Not done**: component-writer/code-reviewer do NOT read:
- Memory files (`.devom/agents/*/memory/*.md`)
- Agent workflows
- Project documentation
- Codebase exploration

All needed info goes in the prompt itself.

---

## 🗂️ Project Structure

```
devom/
├── .claude/agents/
│   ├── component-writer.md
│   ├── hook-writer.md
│   ├── storybook-writer.md
│   └── code-reviewer.md
├── .devom/
│   ├── CLAUDE.md (this file - main reference)
│   ├── docs/ (detailed documentation)
│   │   ├── READING_GUIDE.md
│   │   ├── coding-rules.md
│   │   ├── component-patterns.md
│   │   ├── hook-patterns.md
│   │   ├── testing-patterns.md
│   │   ├── accessibility-guide.md
│   │   ├── performance-guide.md
│   │   └── code-review.md
│   ├── templates/
│   │   └── task-prompts/ (prompt examples)
│   │       ├── component.md
│   │       ├── hook.md
│   │       ├── test.md
│   │       └── story.md
│   ├── epics/
│   │   ├── README.md
│   │   ├── TEMPLATE.md
│   │   └── EPIC-{ulid}/ (each epic's files)
│   └── agents/
│       ├── component-developer/
│       ├── hook-developer/
│       ├── storybook-developer/
│       └── code-reviewer/
├── apps/
│   ├── web/ (Next.js or Vite app)
│   │   ├── src/
│   │   │   ├── app/ (or pages/)
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   └── public/
│   └── admin/ (Admin dashboard)
│       └── src/
├── packages/
│   ├── ui/ (UI components library)
│   │   └── src/
│   │       ├── Button/
│   │       │   ├── Button.tsx
│   │       │   ├── Button.types.ts
│   │       │   ├── button.module.css
│   │       │   ├── Button.test.tsx
│   │       │   ├── Button.stories.tsx
│   │       │   ├── docs/
│   │       │   │   └── EPIC.md
│   │       │   └── index.ts
│   │       └── index.ts
│   ├── hooks/ (Custom hooks library)
│   │   └── src/
│   │       ├── useUserData/
│   │       │   ├── useUserData.ts
│   │       │   ├── useUserData.types.ts
│   │       │   ├── useUserData.test.ts
│   │       │   └── index.ts
│   │       └── index.ts
│   ├── stores/ (State management - Zustand)
│   │   └── src/
│   ├── utils/ (Utilities)
│   │   └── src/
│   ├── types/ (Shared types)
│   │   └── src/
│   └── config/ (Shared config)
│       └── src/
```

---

## 📚 Detailed Documentation Index

| Topic | Link | When to Read |
|-------|------|--------------|
| **How to read these docs** | [READING_GUIDE](.devom/docs/READING_GUIDE.md) | First time |
| **Detailed coding standards** | [coding-rules](.devom/docs/coding-rules.md) | Writing code |
| **Component patterns** | [component-patterns](.devom/docs/component-patterns.md) | Writing components |
| **Hook patterns** | [hook-patterns](.devom/docs/hook-patterns.md) | Writing hooks |
| **All test patterns & examples** | [testing-patterns](.devom/docs/testing-patterns.md) | Writing tests |
| **Accessibility guide** | [accessibility-guide](.devom/docs/accessibility-guide.md) | A11y implementation |
| **Performance guide** | [performance-guide](.devom/docs/performance-guide.md) | Optimization |
| **State management (Zustand)** | [state-management](.devom/docs/state-management.md) | Using stores |
| **Styling guide** | [styling-guide](.devom/docs/styling-guide.md) | CSS/Tailwind |
| **Code review process** | [code-review](.devom/docs/code-review.md) | Reviewing code |
| **Epic template** | [epics/TEMPLATE](.devom/epics/TEMPLATE.md) | Writing Epic |

---

## 🚀 Start New Feature (Step-by-Step)

### Step 1: Create Epic

```bash
# Generate ULID
ulid=$(node -e "console.log(Date.now().toString(36) + Math.random().toString(36).substr(2))")

# Create epic folder
mkdir -p .devom/epics/EPIC-$ulid

# Copy template
cp .devom/epics/TEMPLATE.md .devom/epics/EPIC-$ulid/EPIC.md

# Edit EPIC.md with your feature details
```

### Step 2: Create Feature Branch

```bash
git checkout -b feature/EPIC-$ulid
```

### Step 3: Start Task 1

```bash
# Call component-writer for all components
# → All run in parallel in single response

# Call hook-writer for all hooks
# → All run in parallel in single response

# Call component-writer for all tests
# → All run in parallel in single response

# Call storybook-writer for all stories
# → All run in parallel in single response

# Validate
yarn test && npx tsc --noEmit
```

### Step 4: Review & Next Task

```bash
# Call code-reviewer for all changed files
# → All review in parallel in single response

# If PASS → Continue to Task 2 (if needed)
# If FAIL → Fix → Revalidate → Re-review
```

### Step 5: Complete & Commit

```bash
# All tasks done + all tests passing + all reviews approved

git add .
git commit -m "feat: ..."
gh pr create --title "..." --body "..."
```

---

## 📄 Epic Documentation Management

### ⚠️ CRITICAL: Epics are Local Only

**`.devom/epics/` is gitignored working documents:**
- ❌ **DO NOT commit** this directory to git
- ✅ **Local only** - for your development process
- ✅ **Final docs** go to component docs folders
- ✅ Only tracked files: `README.md`, `TEMPLATE.md`, `.gitkeep`

**Why gitignored?**
- Working documents change frequently during development
- Different developers may have different active epics
- Prevents conflicts and noise in git history
- Final documentation is what matters for the codebase

### Final Documentation Placement

After Epic completion, copy documentation to the component docs location:

```bash
# Source (working epic - LOCAL ONLY, gitignored)
.devom/epics/EPIC-{ulid}/EPIC.md

# Destination (component documentation folder - COMMITTED TO GIT)
packages/{package}/src/{component}/docs/EPIC.md

# Example
.devom/epics/EPIC-m1n2o3p4/EPIC.md  # ← Not in git
→ packages/ui/src/Button/docs/EPIC.md  # ← Committed
```

### Update Strategy

| Situation | Action | Command |
|-----------|--------|---------|
| **No existing docs/** | Create docs folder | `mkdir -p packages/.../docs/` |
| **No existing EPIC.md** | Copy new epic | `cp .devom/epics/EPIC-{ulid}/EPIC.md packages/.../docs/EPIC.md` |
| **Existing EPIC.md** | Update with latest | `cp -f .devom/epics/EPIC-{ulid}/EPIC.md packages/.../docs/EPIC.md` |
| **Multiple iterations** | Keep version history | Add version/date in EPIC.md header |

### Documentation Contents

**EPIC.md** should include:
- ✅ Final implementation details
- ✅ Completed test coverage results
- ✅ Component API documentation
- ✅ Props interface documentation
- ✅ Hook API documentation
- ✅ Accessibility features
- ✅ Any deviations from original epic
- ✅ Future enhancement notes
- ✅ Maintenance guidelines


### Example Component Structure

```
packages/ui/src/Button/
├── docs/
│   └── EPIC.md              # ← Final epic documentation
├── Button.tsx
├── Button.types.ts
├── button.module.css
├── Button.test.tsx
├── Button.stories.tsx
└── index.ts
```

### Commit Message

```bash
git add packages/{package}/src/{component}/docs/
git commit -m "docs: update {component} documentation

- Epic ID: EPIC-{ulid}
- EPIC.md: Implementation complete
- All tests passing
- All stories documented
- Documentation finalized"
```

---

## ❓ Frequently Asked Questions

**Q: When should I use Tasks?**
A: Always use Tasks for features with 3+ files. Split if needed.

**Q: Can I skip typecheck?**
A: No. Never proceed without `npx tsc --noEmit` passing.

**Q: Do component-writer/code-reviewer read memory files?**
A: No. All info must be in the prompt (Self-Contained).

**Q: How many components can component-writer handle?**
A: Parallel: 3 independent components optimal. Larger batches work but may be slower.

**Q: What if component-writer fails?**
A: Check error message → Fix prompt → Retry.

**Q: Should I export styles in index.ts?**
A: No. Styles are internal implementation. Only export component and types.

**Q: When to use custom hooks vs inline logic?**
A: Use hooks when logic is reused across components or complex enough to warrant testing.

**Q: CSS Modules vs Tailwind?**
A: Use consistent approach per project. CSS Modules for design system, Tailwind for rapid prototyping.

**Q: When to write Storybook stories?**
A: After component and tests are complete. Stories document component variants.

**Q: How to handle global state?**
A: Use Zustand for shared state. Keep local state in component with useState.

See [Full FAQ](.devom/docs/READING_GUIDE.md#faq) for more answers.

---

## 🔗 Essential References

- **Epic System**: Start at [epics/README](.devom/epics/README.md)
- **Agent Workflows**: Check [.claude/agents/](.claude/agents/)
- **component-writer Templates**: [templates/task-prompts/](.devom/templates/task-prompts/)
- **Example Epics**: [epics/EPIC-example/](.devom/epics/EPIC-example/)

---

## 📊 Key Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Max Task Size** | 3 files | More = split Task |
| **Max Context** | ~140K tokens | 70% of session max |
| **Parallel Files** | 3 optimal | Can do more if needed |
| **Test Coverage** | 80%+ | Per Task target |
| **Component Size** | 200 lines max | Split if larger |
| **Revalidation** | Always | After review findings |

---

## 🎨 Frontend-Specific Best Practices

### Component Design

```typescript
// ✅ DO - Small, focused components
export const Button: FC<ButtonProps> = ({ children, ...props }) => { ... }
export const IconButton: FC<IconButtonProps> = ({ icon, ...props }) => { ... }

// ❌ DON'T - Large, multi-purpose components
export const Button: FC<AllButtonProps> = ({ type, icon, badge, ... }) => { ... }
```

### State Management

```typescript
// ✅ DO - Zustand for global state
import { create } from 'zustand';

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

// ✅ DO - useState for local state
const [isOpen, setIsOpen] = useState(false);

// ❌ DON'T - Global state for local concerns
const isModalOpen = useGlobalStore((state) => state.isModalOpen);
```

### Performance Optimization

```typescript
// ✅ DO - Memoize expensive computations
const sortedUsers = useMemo(() =>
  users.sort((a, b) => a.name.localeCompare(b.name)),
  [users]
);

// ✅ DO - Memoize callbacks passed to children
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);

// ❌ DON'T - Premature optimization
const name = useMemo(() => user.name, [user.name]); // Too simple
```

### Accessibility

```typescript
// ✅ DO - Full accessibility support
<button
  aria-label="Close dialog"
  aria-pressed={isOpen}
  onClick={handleClose}
  onKeyDown={(e) => e.key === 'Escape' && handleClose()}
>
  Close
</button>

// ❌ DON'T - Missing accessibility
<div onClick={handleClose}>Close</div>
```

### Testing

```typescript
// ✅ DO - Test user behavior
import { render, screen, userEvent } from '@testing-library/react';

test('button calls onClick when clicked', async () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click me</Button>);

  await userEvent.click(screen.getByRole('button'));

  expect(onClick).toHaveBeenCalledTimes(1);
});

// ❌ DON'T - Test implementation details
test('button has correct className', () => {
  const { container } = render(<Button />);
  expect(container.firstChild).toHaveClass('button-primary');
});
```

---

## 📅 Version History

| Version | Date | Changes |
|---------|------|---------|
| 4.0 | 2025-11-11 | Initial frontend edition (DDK) |

---

**Status**: Current Production Version
**Maintained by**: Claude Code Doctor
**Last Updated**: 2025-11-11

> **Core Principle**: 1 Epic = 1 Branch → Task units → Parallel workers → Tested complete → One commit
