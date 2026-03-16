import { useState, useCallback } from "react"
import type { FormFieldConfig } from "@devom/editor-core"
import { validateField } from "@devom/editor-core"

interface FormFieldInfo {
  elementId: string
  formField: FormFieldConfig
}

interface FormRuntime {
  values: Record<string, unknown>
  errors: Record<string, string | null>
  setValue: (name: string, value: unknown) => void
  handleSubmit: (e: React.FormEvent) => void
  handleReset: () => void
}

export function useFormRuntime(fields: FormFieldInfo[], enabled: boolean): FormRuntime {
  const buildDefaults = useCallback(() => {
    const defaults: Record<string, unknown> = {}
    for (const f of fields) {
      defaults[f.formField.name] = f.formField.defaultValue ?? ""
    }
    return defaults
  }, [fields])

  const [values, setValues] = useState<Record<string, unknown>>(() => buildDefaults())
  const [errors, setErrors] = useState<Record<string, string | null>>({})

  const setValue = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: null }))
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!enabled) return

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
        showFormToast(values)
      }
    },
    [fields, values, enabled]
  )

  const handleReset = useCallback(() => {
    setValues(buildDefaults())
    setErrors({})
  }, [buildDefaults])

  return { values, errors, setValue, handleSubmit, handleReset }
}

function showFormToast(values: Record<string, unknown>) {
  const toast = document.createElement("div")
  toast.style.cssText = `
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #18181b; color: #fafafa; padding: 12px 20px; border-radius: 8px;
    font-size: 13px; font-family: monospace; z-index: 9999;
    max-width: 400px; max-height: 200px; overflow: auto;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    white-space: pre-wrap; word-break: break-all;
  `
  toast.textContent = JSON.stringify(values, null, 2)
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 4000)
}
