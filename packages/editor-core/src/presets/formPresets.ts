import type { DocumentStore } from "../stores/DocumentStore"
import { DEFAULT_ELEMENT_STYLE } from "../types"
import { createTemplateHelper } from "./templates/helpers"

const rel = { position: "relative" as const, left: undefined, top: undefined }
const fieldSizing = { w: "fill" as const, h: "hug" as const }

export type FormPresetId = "signup" | "contact" | "feedback"

export interface FormPresetMeta {
  id: FormPresetId
  label: string
  description: string
}

export const FORM_PRESETS: FormPresetMeta[] = [
  { id: "signup", label: "Sign Up", description: "Name, Email, Password" },
  { id: "contact", label: "Contact", description: "Name, Email, Message" },
  { id: "feedback", label: "Feedback", description: "Rating, Comment" },
]

export function buildFormPreset(store: DocumentStore, presetId: FormPresetId, parentId?: string): string {
  const add = createTemplateHelper(store)
  const targetParent = parentId ?? store.rootId

  // Create form container
  const formId = add("form", targetParent, {
    name: `${presetId} Form`,
    style: { ...DEFAULT_ELEMENT_STYLE.form },
    layoutMode: "flex",
    layoutProps: { direction: "column", gap: 20, paddingTop: 32, paddingRight: 32, paddingBottom: 32, paddingLeft: 32, alignItems: "stretch" },
    sizing: { w: "fixed", h: "hug" },
  })
  if (!formId) return ""

  switch (presetId) {
    case "signup":
      buildSignupFields(add, formId)
      break
    case "contact":
      buildContactFields(add, formId)
      break
    case "feedback":
      buildFeedbackFields(add, formId)
      break
  }

  return formId
}

function buildSignupFields(add: ReturnType<typeof createTemplateHelper>, formId: string) {
  // Title
  add("text", formId, {
    name: "Title",
    style: { ...rel, fontSize: 20, fontWeight: 700, color: "#0f172a" },
    props: { content: "Create an account" },
    sizing: fieldSizing,
  })
  add("text", formId, {
    name: "Subtitle",
    style: { ...rel, fontSize: 14, color: "#64748b" },
    props: { content: "Enter your information to get started" },
    sizing: fieldSizing,
  })

  // Name
  add("sc:input", formId, {
    name: "Name",
    style: { ...rel, width: undefined },
    props: { placeholder: "John Doe", label: "Name" },
    sizing: fieldSizing,
    formField: { name: "name", validation: { required: true } },
  })

  // Email
  add("sc:input", formId, {
    name: "Email",
    style: { ...rel, width: undefined },
    props: { placeholder: "name@example.com", label: "Email" },
    sizing: fieldSizing,
    formField: { name: "email", validation: { required: true, pattern: "email" } },
  })

  // Password
  add("sc:input", formId, {
    name: "Password",
    style: { ...rel, width: undefined },
    props: { placeholder: "••••••••", label: "Password", type: "password" },
    sizing: fieldSizing,
    formField: { name: "password", validation: { required: true, min: 8 } },
  })

  // Terms checkbox
  add("sc:checkbox", formId, {
    name: "Terms",
    style: { ...rel },
    props: { label: "I agree to the Terms of Service", checked: false },
    sizing: fieldSizing,
    formField: { name: "terms", validation: { required: "You must agree to the terms" } },
  })

  // Submit
  add("sc:button", formId, {
    name: "Submit",
    style: { ...rel, width: undefined },
    props: { label: "Create account", variant: "default", size: "default" },
    formRole: "submit",
    sizing: fieldSizing,
  })
}

function buildContactFields(add: ReturnType<typeof createTemplateHelper>, formId: string) {
  // Title
  add("text", formId, {
    name: "Title",
    style: { ...rel, fontSize: 20, fontWeight: 700, color: "#0f172a" },
    props: { content: "Contact Us" },
    sizing: fieldSizing,
  })
  add("text", formId, {
    name: "Subtitle",
    style: { ...rel, fontSize: 14, color: "#64748b" },
    props: { content: "Send us a message and we'll get back to you" },
    sizing: fieldSizing,
  })

  // Name
  add("sc:input", formId, {
    name: "Name",
    style: { ...rel, width: undefined },
    props: { placeholder: "Your name", label: "Name" },
    sizing: fieldSizing,
    formField: { name: "name", validation: { required: true } },
  })

  // Email
  add("sc:input", formId, {
    name: "Email",
    style: { ...rel, width: undefined },
    props: { placeholder: "name@example.com", label: "Email" },
    sizing: fieldSizing,
    formField: { name: "email", validation: { required: true, pattern: "email" } },
  })

  // Subject
  add("sc:select", formId, {
    name: "Subject",
    style: { ...rel, width: undefined },
    props: { placeholder: "Select a topic", label: "Subject", options: ["General Inquiry", "Technical Support", "Billing", "Partnership", "Other"] },
    sizing: fieldSizing,
    formField: { name: "subject", validation: { required: true } },
  })

  // Message
  add("sc:textarea", formId, {
    name: "Message",
    style: { ...rel, width: undefined },
    props: { placeholder: "Tell us how we can help...", label: "Message" },
    sizing: fieldSizing,
    formField: { name: "message", validation: { required: true, min: 10 } },
  })

  // Submit
  add("sc:button", formId, {
    name: "Submit",
    style: { ...rel, width: undefined },
    props: { label: "Send message", variant: "default", size: "default" },
    formRole: "submit",
    sizing: fieldSizing,
  })
}

function buildFeedbackFields(add: ReturnType<typeof createTemplateHelper>, formId: string) {
  // Title
  add("text", formId, {
    name: "Title",
    style: { ...rel, fontSize: 20, fontWeight: 700, color: "#0f172a" },
    props: { content: "Share your feedback" },
    sizing: fieldSizing,
  })
  add("text", formId, {
    name: "Subtitle",
    style: { ...rel, fontSize: 14, color: "#64748b" },
    props: { content: "Help us improve our product" },
    sizing: fieldSizing,
  })

  // Rating
  add("sc:select", formId, {
    name: "Rating",
    style: { ...rel, width: undefined },
    props: { placeholder: "Select rating", label: "Overall satisfaction", options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"] },
    sizing: fieldSizing,
    formField: { name: "rating", validation: { required: true } },
  })

  // Category
  add("sc:radio-group", formId, {
    name: "Category",
    style: { ...rel },
    props: { label: "Feedback type", options: ["Bug Report", "Feature Request", "Improvement", "Other"] },
    sizing: fieldSizing,
    formField: { name: "category", validation: { required: true } },
  })

  // Comment
  add("sc:textarea", formId, {
    name: "Comment",
    style: { ...rel, width: undefined },
    props: { placeholder: "Share your thoughts...", label: "Comments" },
    sizing: fieldSizing,
    formField: { name: "comment" },
  })

  // Newsletter opt-in
  add("sc:switch", formId, {
    name: "Newsletter",
    style: { ...rel },
    props: { label: "Subscribe to product updates" },
    sizing: fieldSizing,
    formField: { name: "newsletter" },
  })

  // Submit
  add("sc:button", formId, {
    name: "Submit",
    style: { ...rel, width: undefined },
    props: { label: "Submit feedback", variant: "default", size: "default" },
    formRole: "submit",
    sizing: fieldSizing,
  })
}
