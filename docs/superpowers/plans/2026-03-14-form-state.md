# Form State Management Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add form state management to the editor — Interaction mode prototyping with validation + react-hook-form/zod code export.

**Architecture:** Element-level `formField?` attribute on EditorElement, new `form` ElementType as container. Canvas manages runtime formState locally (not in DocumentStore) to avoid undo/redo pollution. Export generates complete react-hook-form + zod code in a new "Form Code" tab.

**Tech Stack:** MobX (stores), React (UI), postMessage (Shell↔Canvas), zod code generation (export only, not runtime)

**Spec:** `docs/superpowers/specs/2026-03-14-form-state-design.md`

---

## File Structure

### New Files

- `packages/editor-core/src/export/formCodeExport.ts` — react-hook-form + zod code generator
- `packages/editor-core/src/utils/validateField.ts` — Lightweight validation engine (shared between Canvas runtime and export)
- `apps/editor-canvas/src/hooks/useFormRuntime.ts` — Canvas form state/errors/submit logic

### Modified Files

- `packages/editor-core/src/types.ts` — FormFieldConfig, ValidationRule, 'form' ElementType, formField on EditorElement
- `packages/editor-core/src/stores/DocumentStore.ts` — updateFormField, form-aware addElement, duplicate name on copy
- `packages/editor-core/src/protocol.ts` — SET_INTERACTION_FORM_STATE, FORM_SUBMIT_RESULT messages
- `packages/editor-core/src/utils/getDefaultProps.ts` — Defaults for 'form' type, Button formRole
- `packages/editor-core/src/export/index.ts` — Re-export formCodeExport
- `apps/editor-shell/src/components/properties/componentPropsRegistry.ts` — Button formRole prop
- `apps/editor-shell/src/components/PropertiesPanel.tsx` — Form Field section + Form Container section
- `apps/editor-shell/src/components/Toolbar.tsx` — Form dropdown
- `apps/editor-shell/src/components/ExportModal.tsx` — Form Code tab
- `apps/editor-canvas/src/components/componentRegistry.tsx` — form element rendering, onChange handlers
- `apps/editor-canvas/src/components/ElementRenderer.tsx` — form runtime integration

---

## Chunk 1: Core Data Model & Protocol

### Task 1: Add Form Types to editor-core

**Files:**

- Modify: `packages/editor-core/src/types.ts`

- [ ] **Step 1: Add FormFieldConfig and ValidationRule types**

After the existing type definitions (around line 31, before EditorElement), add:

```typescript
export interface ValidationRule {
  required?: boolean | string
  min?: number
  max?: number
  pattern?: string | "email" | "url"
  message?: string
}

export interface FormFieldConfig {
  name: string
  defaultValue?: string | number | boolean
  validation?: ValidationRule
}
```

- [ ] **Step 2: Add 'form' to ElementType**

In the ElementType union, add `'form'` alongside existing types:

```typescript
| 'form'
```

- [ ] **Step 3: Add formField to EditorElement**

In the EditorElement interface, add after `gridProps?`:

```typescript
formField?: FormFieldConfig
```

- [ ] **Step 4: Re-export new types from package index**

Verify `packages/editor-core/src/index.ts` exports from `types.ts`. If types are already re-exported via `export * from './types'`, no change needed.

- [ ] **Step 5: Run lint**

Run: `pnpm lint`

- [ ] **Step 6: Commit**

```
feat(editor-core): add form state types (FormFieldConfig, ValidationRule, form ElementType)
```

---

### Task 2: Add Protocol Messages

**Files:**

- Modify: `packages/editor-core/src/protocol.ts`

- [ ] **Step 1: Add FormFieldRuntime type**

```typescript
export interface FormFieldRuntime {
  elementId: string
  name: string
  defaultValue: string | number | boolean | undefined
  validation?: ValidationRule
}
```

- [ ] **Step 2: Add Shell→Canvas message**

Add to ShellToCanvasMessage union:

```typescript
| { type: 'SET_INTERACTION_FORM_STATE'; formId: string; fields: FormFieldRuntime[] }
```

- [ ] **Step 3: Add Canvas→Shell message**

Add to CanvasToShellMessage union:

```typescript
| { type: 'FORM_SUBMIT_RESULT'; formId: string; values: Record<string, unknown> }
```

- [ ] **Step 4: Run lint & commit**

```
feat(editor-core): add form state protocol messages
```

---

### Task 3: DocumentStore — Form Support

**Files:**

- Modify: `packages/editor-core/src/stores/DocumentStore.ts`
- Modify: `packages/editor-core/src/utils/getDefaultProps.ts`

- [ ] **Step 1: Add 'form' defaults to getDefaultProps**

Add case for 'form' type:

```typescript
case 'form':
  return { name: 'form' }
```

- [ ] **Step 2: Add DEFAULT_ELEMENT_STYLE for 'form'**

In the defaults file where DEFAULT_ELEMENT_STYLE is defined, add:

```typescript
form: { width: 400, padding: 24, gap: 16 }
```

With `layoutMode: 'flex'` set in addElement when type is 'form'.

- [ ] **Step 3: Add updateFormField method to DocumentStore**

```typescript
updateFormField(id: string, formField: FormFieldConfig | undefined) {
  const element = this.elements.get(id)
  if (!element) return
  element.formField = formField
}
```

- [ ] **Step 4: Handle formField in duplicate/copy**

In the duplicate logic, when copying an element with formField, auto-append `_copy` to name:

```typescript
if (clone.formField) {
  clone.formField = { ...clone.formField, name: clone.formField.name + "_copy" }
}
```

- [ ] **Step 5: Add getFormFields helper**

Collect all formField-bearing descendants of a form container:

```typescript
getFormFields(formId: string): Array<{ element: EditorElement; formField: FormFieldConfig }> {
  const result: Array<{ element: EditorElement; formField: FormFieldConfig }> = []
  const traverse = (id: string) => {
    const el = this.elements.get(id)
    if (!el) return
    if (el.formField) result.push({ element: el, formField: el.formField })
    el.children.forEach(traverse)
  }
  traverse(formId)
  return result
}
```

- [ ] **Step 6: Auto-set layoutMode for 'form' in addElement**

In addElement, after creating the element, if type is 'form':

```typescript
if (type === "form") {
  newElement.layoutMode = "flex"
  newElement.layoutProps = { ...newElement.layoutProps, direction: "column", gap: 16 }
}
```

- [ ] **Step 7: Run lint & commit**

```
feat(editor-core): add form support to DocumentStore and defaults
```

---

### Task 4: Validation Engine

**Files:**

- Create: `packages/editor-core/src/utils/validateField.ts`

- [ ] **Step 1: Create validateField utility**

```typescript
import type { ValidationRule } from "../types"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_REGEX = /^https?:\/\/.+/

export function validateField(value: unknown, rule: ValidationRule): string | null {
  const strVal = value == null ? "" : String(value)
  const isEmpty = value === "" || value == null || value === false

  if (rule.required && isEmpty) {
    return typeof rule.required === "string" ? rule.required : rule.message || "필수 항목입니다"
  }

  if (!isEmpty && rule.min != null) {
    if (typeof value === "number" && value < rule.min) {
      return rule.message || `최소 ${rule.min}`
    }
    if (typeof value === "string" && value.length < rule.min) {
      return rule.message || `최소 ${rule.min}자`
    }
  }

  if (!isEmpty && rule.max != null) {
    if (typeof value === "number" && value > rule.max) {
      return rule.message || `최대 ${rule.max}`
    }
    if (typeof value === "string" && value.length > rule.max) {
      return rule.message || `최대 ${rule.max}자`
    }
  }

  if (!isEmpty && rule.pattern) {
    if (rule.pattern === "email" && !EMAIL_REGEX.test(strVal)) {
      return rule.message || "이메일 형식이 올바르지 않습니다"
    }
    if (rule.pattern === "url" && !URL_REGEX.test(strVal)) {
      return rule.message || "URL 형식이 올바르지 않습니다"
    }
    if (rule.pattern !== "email" && rule.pattern !== "url") {
      if (!new RegExp(rule.pattern).test(strVal)) {
        return rule.message || "형식이 올바르지 않습니다"
      }
    }
  }

  return null
}
```

- [ ] **Step 2: Export from editor-core index**

Add to `packages/editor-core/src/index.ts`:

```typescript
export { validateField } from "./utils/validateField"
```

- [ ] **Step 3: Run lint & commit**

```
feat(editor-core): add validateField utility for form validation
```

---

## Chunk 2: Shell UI (Toolbar, PropertiesPanel, ExportModal)

### Task 5: Toolbar — Form Dropdown

**Files:**

- Modify: `apps/editor-shell/src/components/Toolbar.tsx`

- [ ] **Step 1: Add FORM_ITEMS constant**

Near the existing SHADCN_COMPONENTS array, add:

```typescript
const FORM_ITEMS = [
  { type: "form" as const, label: "Form Container", category: "Container" },
  { type: "sc:input" as const, label: "Input", category: "Fields" },
  { type: "sc:textarea" as const, label: "Textarea", category: "Fields" },
  { type: "sc:checkbox" as const, label: "Checkbox", category: "Fields" },
  { type: "sc:switch" as const, label: "Switch", category: "Fields" },
  { type: "sc:select" as const, label: "Select", category: "Fields" },
  { type: "sc:radio-group" as const, label: "RadioGroup", category: "Fields" },
  { type: "sc:slider" as const, label: "Slider", category: "Fields" },
  { type: "sc:button" as const, label: "Submit Button", category: "Actions" },
] as const
```

- [ ] **Step 2: Add Form dropdown UI**

Follow the existing UI dropdown pattern (SHADCN_COMPONENTS dropdown). Add a "Form" button with dropdown between UI and Sections:

- Dropdown groups: Container, Fields, Actions (with separator lines)
- Each item is draggable (same DnD pattern as UI dropdown)
- When dragging from Form dropdown, items are created with `formField: { name: autoName() }`
- Submit Button gets `formRole: 'submit'` in props

- [ ] **Step 3: Add form-aware DnD creation logic**

When creating element from Form dropdown, pass `initialProps` and `formField`:

```typescript
const isFormDropdown = true // track which dropdown the drag came from
// In the DND_CREATE_ELEMENT handler:
if (isFormItem) {
  const formField = itemType !== "form" && itemType !== "sc:button" ? { name: `${itemType.replace("sc:", "")}_${Date.now() % 1000}` } : undefined
  const extraProps = itemType === "sc:button" ? { formRole: "submit" } : {}
  // pass formField and extraProps to addElement
}
```

- [ ] **Step 4: Auto-create form container if needed**

When dropping a form field and no form container exists as parent:

1. Create `form` element first
2. Add the field as child of the new form

- [ ] **Step 5: Run lint & commit**

```
feat(editor-shell): add Form dropdown to Toolbar
```

---

### Task 6: PropertiesPanel — Form Field Section

**Files:**

- Modify: `apps/editor-shell/src/components/PropertiesPanel.tsx`
- Modify: `apps/editor-shell/src/components/properties/componentPropsRegistry.ts`

- [ ] **Step 1: Add formRole to Button in componentPropsRegistry**

Add to `sc:button` entry:

```typescript
{ key: 'formRole', label: 'Form Role', type: 'select', options: ['none', 'submit', 'reset'], default: 'none' }
```

- [ ] **Step 2: Define FORM_FIELD_TYPES constant**

```typescript
const FORM_FIELD_TYPES = new Set(["sc:input", "sc:textarea", "sc:checkbox", "sc:switch", "sc:select", "sc:radio-group", "sc:slider"])
```

- [ ] **Step 3: Add Form Field toggle section to PropertiesPanel**

After existing Component Props section, add Form Field section for FORM_FIELD_TYPES:

```
Form Field [toggle]
├── Name: text input
├── Default Value: text input (type-appropriate)
├── ── Validation ──
├── Required: toggle
├── Min: number input (Input/Textarea/Slider only)
├── Max: number input (Input/Textarea/Slider only)
├── Pattern: select with email/url/custom (Input/Textarea only)
└── Error Message: text input
```

Toggle ON: calls `documentStore.updateFormField(id, { name: autoName() })`
Toggle OFF: calls `documentStore.updateFormField(id, undefined)`
Each sub-field: calls `documentStore.updateFormField(id, { ...current, [key]: value })`

- [ ] **Step 4: Add validation field visibility per component type**

```typescript
const VALIDATION_FIELDS: Record<string, string[]> = {
  "sc:input": ["required", "min", "max", "pattern", "message"],
  "sc:textarea": ["required", "min", "max", "pattern", "message"],
  "sc:checkbox": ["required", "message"],
  "sc:switch": ["required", "message"],
  "sc:select": ["required", "message"],
  "sc:radio-group": ["required", "message"],
  "sc:slider": ["min", "max", "message"],
}
```

- [ ] **Step 5: Add Form Container section**

When a `form` element is selected, show:

```
Form Settings
├── Name: text input (used as export function name)
├── Fields: N fields (count of formField descendants)
└── [Preview Schema] button (optional, shows zod schema in alert)
```

Form name is stored in `props.name`.

- [ ] **Step 6: Add name duplicate warning**

When editing formField.name, check siblings in same form for duplicates. Show red border + warning text if duplicate found.

- [ ] **Step 7: Run lint & commit**

```
feat(editor-shell): add Form Field section to PropertiesPanel
```

---

### Task 7: ExportModal — Form Code Tab

**Files:**

- Create: `packages/editor-core/src/export/formCodeExport.ts`
- Modify: `packages/editor-core/src/export/index.ts`
- Modify: `apps/editor-shell/src/components/ExportModal.tsx`

- [ ] **Step 1: Create formCodeExport.ts**

This generates complete react-hook-form + zod code from form elements.

```typescript
import type { EditorElement, FormFieldConfig } from "../types"

interface FormInfo {
  formElement: EditorElement
  fields: Array<{ element: EditorElement; formField: FormFieldConfig }>
}

export function exportToFormCode(elements: Map<string, EditorElement>, rootId: string): string {
  const forms = collectForms(elements, rootId)
  if (forms.length === 0) return "// No form elements found"
  return forms.map((f) => generateFormCode(f)).join("\n\n")
}
```

Core logic:

- `collectForms()`: Walk tree, find `form` type elements, collect their formField descendants
- `generateFormCode(form)`: Generate imports + zod schema + useForm + JSX
- `generateZodField(formField, elementType)`: Map ValidationRule to zod chain
- `generateFieldBinding(element, formField)`: Map component type to field render pattern

**Zod generation per type:**

- Input/Textarea → `z.string()` + validation chain
- Checkbox/Switch → `z.boolean()` + optional refine
- Select/RadioGroup → `z.string()` + optional min(1)
- Slider → `z.number()` + optional min/max

**Pattern preset handling:**

- `pattern: 'email'` → `.email("이메일 형식이 아닙니다")`
- `pattern: 'url'` → `.url("URL 형식이 아닙니다")`
- custom string → `.regex(new RegExp("..."), "...")`

**Field binding per component:**

- Input: `<Input {...field} placeholder="..." />`
- Textarea: `<Textarea {...field} />`
- Checkbox: `<Checkbox checked={field.value} onCheckedChange={field.onChange} />`
- Switch: `<Switch checked={field.value} onCheckedChange={field.onChange} />`
- Select: `<Select onValueChange={field.onChange} value={field.value}>...</Select>`
- RadioGroup: `<RadioGroup onValueChange={field.onChange} value={field.value}>...</RadioGroup>`
- Slider: `<Slider value={[field.value]} onValueChange={(v) => field.onChange(v[0])} />`

**Imports:** Only import components that are actually used.

- [ ] **Step 2: Export from index**

Add to `packages/editor-core/src/export/index.ts`:

```typescript
export { exportToFormCode } from "./formCodeExport"
```

- [ ] **Step 3: Add Form Code tab to ExportModal**

Extend format type:

```typescript
type ExportFormat = "html" | "jsx" | "json" | "form"
```

Add tab button (only visible when document contains form elements):

```typescript
{hasForms && (
  <button onClick={() => setFormat('form')} ...>Form Code</button>
)}
```

Add output case:

```typescript
format === 'form' ? exportToFormCode(elements, rootId) : ...
```

- [ ] **Step 4: Run lint & commit**

```
feat(editor): add Form Code export with react-hook-form + zod generation
```

---

## Chunk 3: Canvas Runtime

### Task 8: Canvas — Form Element Rendering

**Files:**

- Modify: `apps/editor-canvas/src/components/componentRegistry.tsx`
- Modify: `apps/editor-canvas/src/components/ElementRenderer.tsx`

- [ ] **Step 1: Add 'form' to componentRegistry**

Add form element renderer:

```typescript
'form': (props, editorMode) => null // children rendered by ElementRenderer, form tag wraps them
```

The `form` type renders as a `<form>` tag in ElementRenderer, not in the registry (because it needs to wrap children).

- [ ] **Step 2: Update ElementRenderer for form type**

In ElementRenderer, when element.type is 'form':

- Edit mode: render as `<div>` (normal container behavior)
- Interact mode: render as `<form>` with `onSubmit` handler that calls the form runtime

```typescript
const Tag = element.type === 'form' && editorMode === 'interact' ? 'form' : 'div'
// In the render:
<Tag
  onSubmit={element.type === 'form' ? handleFormSubmit : undefined}
  ...
>
  {children}
</Tag>
```

- [ ] **Step 3: Run lint & commit**

```
feat(editor-canvas): render form element as <form> tag in Interact mode
```

---

### Task 9: Canvas — Form Runtime Hook

**Files:**

- Create: `apps/editor-canvas/src/hooks/useFormRuntime.ts`
- Modify: `apps/editor-canvas/src/components/ElementRenderer.tsx`
- Modify: `apps/editor-canvas/src/components/componentRegistry.tsx`

- [ ] **Step 1: Create useFormRuntime hook**

```typescript
import { useState, useCallback } from "react"
import type { EditorElement, FormFieldConfig, ValidationRule } from "@devom/editor-core"
import { validateField } from "@devom/editor-core"

interface FormRuntime {
  values: Record<string, unknown>
  errors: Record<string, string | null>
  setValue: (name: string, value: unknown) => void
  handleSubmit: (e: React.FormEvent) => void
  handleReset: () => void
}

export function useFormRuntime(formId: string, fields: Array<{ elementId: string; formField: FormFieldConfig }>, enabled: boolean): FormRuntime {
  const buildDefaults = useCallback(() => {
    const defaults: Record<string, unknown> = {}
    for (const f of fields) {
      defaults[f.formField.name] = f.formField.defaultValue ?? ""
    }
    return defaults
  }, [fields])

  const [values, setValues] = useState<Record<string, unknown>>(buildDefaults)
  const [errors, setErrors] = useState<Record<string, string | null>>({})

  const setValue = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: null })) // clear error on input
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const newErrors: Record<string, string | null> = {}
      let hasError = false

      for (const f of fields) {
        if (f.formField.validation) {
          const error = validateField(values[f.formField.name], f.formField.validation)
          newErrors[f.formField.name] = error
          if (error) hasError = true
        }
      }

      setErrors(newErrors)

      if (!hasError) {
        // Toast with result
        showFormToast(values)
      }
    },
    [fields, values]
  )

  const handleReset = useCallback(() => {
    setValues(buildDefaults())
    setErrors({})
  }, [buildDefaults])

  return { values, errors, setValue, handleSubmit, handleReset }
}

function showFormToast(values: Record<string, unknown>) {
  // Simple toast overlay — positioned at bottom-center of canvas
  const toast = document.createElement("div")
  toast.style.cssText = `
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #18181b; color: #fafafa; padding: 12px 20px; border-radius: 8px;
    font-size: 13px; font-family: monospace; z-index: 9999;
    max-width: 400px; max-height: 200px; overflow: auto;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `
  toast.textContent = JSON.stringify(values, null, 2)
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 4000)
}
```

- [ ] **Step 2: Integrate useFormRuntime into ElementRenderer**

For elements inside a form container in Interact mode:

- Pass `formRuntime.values[name]` as controlled value
- Pass `formRuntime.setValue` as onChange
- Pass `formRuntime.errors[name]` for error display

This requires threading form context down. Use React Context:

```typescript
// FormRuntimeContext.ts
import { createContext, useContext } from "react"

interface FormRuntimeContextValue {
  values: Record<string, unknown>
  errors: Record<string, string | null>
  setValue: (name: string, value: unknown) => void
}

export const FormRuntimeContext = createContext<FormRuntimeContextValue | null>(null)
export const useFormRuntimeContext = () => useContext(FormRuntimeContext)
```

In ElementRenderer, when rendering a `form` element in Interact mode:

```typescript
if (element.type === 'form' && editorMode === 'interact') {
  return (
    <FormRuntimeContext.Provider value={formRuntime}>
      <form onSubmit={formRuntime.handleSubmit}>
        {children}
      </form>
    </FormRuntimeContext.Provider>
  )
}
```

- [ ] **Step 3: Update componentRegistry to consume form context**

Update form field components (sc:input, sc:textarea, etc.) to use FormRuntimeContext in Interact mode:

```typescript
'sc:input': (props, editorMode) => {
  // In interact mode with formField, use controlled value from context
  // This requires the registry renderers to be actual components (not inline functions)
  // OR pass formField info through props
}
```

Since componentRegistry uses inline functions, the simplest approach: pass `formValue` and `onFormChange` through props when a formField exists. ElementRenderer reads from FormRuntimeContext and passes these to getElementContent as extra args.

Update getElementContent signature:

```typescript
export function getElementContent(
  type: string,
  props: Record<string, unknown>,
  editorMode: "edit" | "interact",
  formContext?: { value: unknown; error: string | null; onChange: (v: unknown) => void }
): React.ReactNode
```

Update sc:input:

```typescript
'sc:input': (props, editorMode, formCtx) => (
  <Input
    placeholder={String(props.placeholder ?? '')}
    type={String(props.type ?? 'text')}
    readOnly={editorMode === 'edit'}
    value={formCtx ? String(formCtx.value ?? '') : undefined}
    onChange={formCtx ? (e) => formCtx.onChange(e.target.value) : undefined}
  />
)
```

Similar updates for all 7 form field types.

- [ ] **Step 4: Add error message rendering below form fields**

In ElementRenderer, after rendering the component content, if formField exists and there's an error:

```typescript
{editorMode === 'interact' && element.formField && formError && (
  <p style={{ color: 'hsl(0 84% 60%)', fontSize: 12, marginTop: 4, padding: '0 2px' }}>
    {formError}
  </p>
)}
```

- [ ] **Step 5: Handle Button formRole**

In componentRegistry, update sc:button to handle formRole in Interact mode:

```typescript
'sc:button': (props, editorMode) => {
  const role = props.formRole as string | undefined
  const type = editorMode === 'interact' && role === 'submit' ? 'submit'
    : editorMode === 'interact' && role === 'reset' ? 'reset'
    : 'button'
  return <Button variant={...} size={...} type={type}>{props.label}</Button>
}
```

- [ ] **Step 6: Wire up mode transition**

When Interact mode is entered (P key), Canvas collects form fields from SYNC_DOCUMENT data and initializes useFormRuntime. When exiting (V/ESC), formState is discarded (hook unmounts or resets).

The form fields are already available in the synced document data (each element has `formField?`). No new message needed — Canvas can derive FormFieldRuntime[] from the document.

- [ ] **Step 7: Run lint & commit**

```
feat(editor-canvas): add form runtime with validation, toast, and error display
```

---

## Chunk 4: Integration & Polish

### Task 10: Shell Message Handling

**Files:**

- Modify: `apps/editor-shell/src/App.tsx` (or wherever Shell handles Canvas messages)

- [ ] **Step 1: Handle FORM_SUBMIT_RESULT message**

When Canvas sends FORM_SUBMIT_RESULT, Shell can optionally log it. Currently toast is shown in Canvas, so Shell just acknowledges:

```typescript
case 'FORM_SUBMIT_RESULT':
  console.log('[Form Submit]', message.formId, message.values)
  break
```

- [ ] **Step 2: Run lint & commit**

```
feat(editor-shell): handle FORM_SUBMIT_RESULT message
```

---

### Task 11: End-to-End Verification

- [ ] **Step 1: Manual test — Form creation**

1. Open editor (pnpm dev)
2. Click Form dropdown → Form Container → verify flex column container appears
3. Drag Input, Checkbox, Submit Button into form
4. Verify each field gets auto-generated name in PropertiesPanel

- [ ] **Step 2: Manual test — Form Field configuration**

1. Select Input → Form Field section visible → toggle ON
2. Set name: "email", pattern: "email", required: true
3. Select Checkbox → toggle ON → set name: "agree", required: true
4. Select Submit Button → set formRole: "submit"

- [ ] **Step 3: Manual test — Interaction mode**

1. Press P to enter Interact mode
2. Type in Input, toggle Checkbox
3. Click Submit with empty fields → error messages appear
4. Fill fields correctly → Submit → toast shows JSON values
5. Press V to exit → form state discarded

- [ ] **Step 4: Manual test — Form Code export**

1. Open Export modal
2. "Form Code" tab visible (only when form exists)
3. Generated code includes: imports, zod schema, useForm, FormField bindings
4. Verify zod schema matches configured validation rules
5. Copy code → paste in Next.js project → should compile and work

- [ ] **Step 5: Manual test — Edge cases**

1. Duplicate form field (Cmd+D) → name gets \_copy suffix
2. Delete form field → no errors
3. Move field outside form → formField retained but not included in validation
4. Multiple forms → independent state, separate export functions

- [ ] **Step 6: Final lint & commit**

```
feat(editor): form state management — complete implementation
```
