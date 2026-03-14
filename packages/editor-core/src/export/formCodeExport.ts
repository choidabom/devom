import type { EditorElement, FormFieldConfig } from "../types"

interface FormInfo {
  formElement: EditorElement
  fields: Array<{ element: EditorElement; formField: FormFieldConfig }>
}

export function exportToFormCode(elements: Record<string, EditorElement>, rootId: string): string {
  const forms = collectForms(elements, rootId)
  if (forms.length === 0) return "// No form elements found"
  return forms.map((f) => generateFormCode(f)).join("\n\n")
}

export function getFormComponentName(formElement: EditorElement): string {
  return toPascalCase(String(formElement.props.name || "MyForm"))
}

export function collectFormComponents(elements: Record<string, EditorElement>, rootId: string): Array<{ id: string; componentName: string; code: string }> {
  const forms = collectForms(elements, rootId)
  const usedNames = new Set<string>()
  return forms.map((f) => {
    let name = getFormComponentName(f.formElement)
    let suffix = 2
    while (usedNames.has(name)) {
      name = `${getFormComponentName(f.formElement)}${suffix++}`
    }
    usedNames.add(name)
    return {
      id: f.formElement.id,
      componentName: name,
      code: generateFormCode(f),
    }
  })
}

function collectForms(elements: Record<string, EditorElement>, rootId: string): FormInfo[] {
  const forms: FormInfo[] = []
  const traverse = (id: string) => {
    const el = elements[id]
    if (!el) return
    if (el.type === "form") {
      const fields = collectFormFields(elements, id)
      forms.push({ formElement: el, fields })
    } else {
      el.children.forEach(traverse)
    }
  }
  traverse(rootId)
  return forms
}

function collectFormFields(elements: Record<string, EditorElement>, formId: string): Array<{ element: EditorElement; formField: FormFieldConfig }> {
  const fields: Array<{ element: EditorElement; formField: FormFieldConfig }> = []
  const traverse = (id: string) => {
    const el = elements[id]
    if (!el) return
    if (el.formField) fields.push({ element: el, formField: el.formField })
    el.children.forEach(traverse)
  }
  // Traverse form children (not the form itself)
  const form = elements[formId]
  form?.children.forEach(traverse)
  return fields
}

function generateFormCode(form: FormInfo): string {
  const formName = toPascalCase(String(form.formElement.props.name || "MyForm"))
  const usedComponents = new Set<string>()

  // Build zod schema
  const schemaFields = form.fields.map((f) => {
    const zodType = getZodType(f.element.type, f.formField)
    return `  ${f.formField.name}: ${zodType}`
  })

  // Build field JSX
  const fieldJsx = form.fields.map((f) => {
    const componentName = getComponentImportName(f.element.type)
    if (componentName) usedComponents.add(componentName)
    return generateFieldJsx(f.element, f.formField)
  })

  // Build imports
  const imports = generateImports(usedComponents)

  // Build default values
  const defaults = form.fields.map((f) => {
    const defVal = getDefaultValueLiteral(f.element.type, f.formField)
    return `    ${f.formField.name}: ${defVal}`
  })

  return `${imports}

const formSchema = z.object({
${schemaFields.join(",\n")}
})

export function ${formName}() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
${defaults.join(",\n")}
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
${fieldJsx.join("\n")}
      </form>
    </Form>
  )
}`
}

function getZodType(elementType: string, formField: FormFieldConfig): string {
  const validation = formField.validation
  let zodChain = ""

  // Base type
  switch (elementType) {
    case "sc:checkbox":
    case "sc:switch":
      zodChain = "z.boolean()"
      break
    case "sc:slider":
      zodChain = "z.number()"
      break
    default:
      // sc:input, sc:textarea, sc:select, sc:radio-group
      zodChain = "z.string()"
  }

  // Add validations
  if (!validation) return zodChain

  // Required
  if (validation.required) {
    if (elementType === "sc:checkbox" || elementType === "sc:switch") {
      const message = typeof validation.required === "string" ? validation.required : "필수 항목입니다"
      zodChain += `.refine(v => v, "${message}")`
    } else {
      const message = typeof validation.required === "string" ? validation.required : "필수 항목입니다"
      zodChain += `.min(1, "${message}")`
    }
  }

  // Min
  if (validation.min !== undefined) {
    zodChain += `.min(${validation.min})`
  }

  // Max
  if (validation.max !== undefined) {
    zodChain += `.max(${validation.max})`
  }

  // Pattern
  if (validation.pattern) {
    if (validation.pattern === "email") {
      zodChain += `.email("이메일 형식이 아닙니다")`
    } else if (validation.pattern === "url") {
      zodChain += `.url("URL 형식이 아닙니다")`
    } else {
      const message = validation.message || "형식이 올바르지 않습니다"
      zodChain += `.regex(/${validation.pattern}/, "${message}")`
    }
  }

  return zodChain
}

function generateFieldJsx(element: EditorElement, formField: FormFieldConfig): string {
  const name = formField.name
  const label = String(element.props.label || name)
  const placeholder = String(element.props.placeholder || "")

  switch (element.type) {
    case "sc:input":
    case "sc:textarea": {
      const Component = element.type === "sc:input" ? "Input" : "Textarea"
      return `        <FormField
          control={form.control}
          name="${name}"
          render={({ field }) => (
            <FormItem>
              <FormLabel>${label}</FormLabel>
              <FormControl>
                <${Component} placeholder="${placeholder}" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />`
    }

    case "sc:checkbox": {
      return `        <FormField
          control={form.control}
          name="${name}"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>${label}</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />`
    }

    case "sc:switch": {
      return `        <FormField
          control={form.control}
          name="${name}"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>${label}</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />`
    }

    case "sc:select": {
      const options = (element.props.options as string[]) ?? []
      const optionItems = options.map((o) => `<SelectItem value="${o}">${o}</SelectItem>`).join("\n                  ")
      return `        <FormField
          control={form.control}
          name="${name}"
          render={({ field }) => (
            <FormItem>
              <FormLabel>${label}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="${placeholder}" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  ${optionItems}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />`
    }

    case "sc:radio-group": {
      const options = (element.props.options as string[]) ?? []
      const radioItems = options
        .map(
          (o) => `              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl>
                  <RadioGroupItem value="${o}" />
                </FormControl>
                <FormLabel className="font-normal">${o}</FormLabel>
              </FormItem>`
        )
        .join("\n")
      return `        <FormField
          control={form.control}
          name="${name}"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>${label}</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
${radioItems}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />`
    }

    case "sc:slider": {
      const min = Number(element.props.min ?? 0)
      const max = Number(element.props.max ?? 100)
      const step = Number(element.props.step ?? 1)
      return `        <FormField
          control={form.control}
          name="${name}"
          render={({ field }) => (
            <FormItem>
              <FormLabel>${label}</FormLabel>
              <FormControl>
                <Slider min={${min}} max={${max}} step={${step}} value={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />`
    }

    default:
      return `        {/* Unsupported field type: ${element.type} */}`
  }
}

function generateImports(usedComponents: Set<string>): string {
  const imports: string[] = []

  // Core form imports
  imports.push(`import { useForm } from "react-hook-form"`)
  imports.push(`import { zodResolver } from "@hookform/resolvers/zod"`)
  imports.push(`import { z } from "zod"`)
  imports.push(`import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"`)

  // Component imports
  const componentImports: Record<string, string> = {
    Input: `import { Input } from "@/components/ui/input"`,
    Textarea: `import { Textarea } from "@/components/ui/textarea"`,
    Checkbox: `import { Checkbox } from "@/components/ui/checkbox"`,
    Switch: `import { Switch } from "@/components/ui/switch"`,
    Select: `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"`,
    RadioGroup: `import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"`,
    Slider: `import { Slider } from "@/components/ui/slider"`,
  }

  for (const comp of usedComponents) {
    if (componentImports[comp]) {
      imports.push(componentImports[comp])
    }
  }

  return imports.join("\n")
}

function getComponentImportName(elementType: string): string | null {
  switch (elementType) {
    case "sc:input":
      return "Input"
    case "sc:textarea":
      return "Textarea"
    case "sc:checkbox":
      return "Checkbox"
    case "sc:switch":
      return "Switch"
    case "sc:select":
      return "Select"
    case "sc:radio-group":
      return "RadioGroup"
    case "sc:slider":
      return "Slider"
    default:
      return null
  }
}

function getDefaultValueLiteral(elementType: string, formField: FormFieldConfig): string {
  // Use explicit default value if set
  if (formField.defaultValue !== undefined) {
    if (typeof formField.defaultValue === "string") return `"${formField.defaultValue}"`
    if (typeof formField.defaultValue === "boolean") return String(formField.defaultValue)
    if (typeof formField.defaultValue === "number") return String(formField.defaultValue)
  }

  // Fall back to type defaults
  switch (elementType) {
    case "sc:checkbox":
    case "sc:switch":
      return "false"
    case "sc:slider":
      return "0"
    default:
      return '""'
  }
}

function toPascalCase(str: string): string {
  return str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^(.)/, (c) => c.toUpperCase())
}
