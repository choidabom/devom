import { createContext, useContext } from "react"

export interface FormRuntimeContextValue {
  values: Record<string, unknown>
  errors: Record<string, string | null>
  setValue: (name: string, value: unknown) => void
}

export const FormRuntimeContext = createContext<FormRuntimeContextValue | null>(null)
export const useFormRuntimeContext = () => useContext(FormRuntimeContext)
