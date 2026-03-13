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
