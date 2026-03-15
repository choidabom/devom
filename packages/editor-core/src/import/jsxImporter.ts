import { parse } from "@babel/parser"
import type { CSSProperties } from "react"
import { getComponentMapping, isUnknownComponent } from "./componentMap"
import { parseTailwindClasses } from "./tailwindMap"
import { DEFAULT_LAYOUT_PROPS, DEFAULT_SIZING } from "../types"
import type { ElementTemplate } from "../types"

// Type definitions for @babel/types nodes (transitive dependency)
interface JSXIdentifier {
  type: "JSXIdentifier"
  name: string
}
interface JSXMemberExpression {
  type: "JSXMemberExpression"
  object: JSXMemberExpression | JSXIdentifier
  property: JSXIdentifier
}
interface JSXAttribute {
  type: "JSXAttribute"
  name: JSXIdentifier
  value: StringLiteral | JSXExpressionContainer | null
}
interface JSXSpreadAttribute {
  type: "JSXSpreadAttribute"
}
interface JSXElement {
  type: "JSXElement"
  openingElement: { name: JSXIdentifier | JSXMemberExpression; attributes: (JSXAttribute | JSXSpreadAttribute)[] }
  children: (JSXElement | JSXFragment | JSXText | JSXExpressionContainer)[]
}
interface JSXFragment {
  type: "JSXFragment"
  children: (JSXElement | JSXFragment | JSXText | JSXExpressionContainer)[]
}
interface JSXText {
  type: "JSXText"
  value: string
}
interface JSXExpressionContainer {
  type: "JSXExpressionContainer"
  expression: Expression | JSXEmptyExpression
}
interface JSXEmptyExpression {
  type: "JSXEmptyExpression"
}
interface StringLiteral {
  type: "StringLiteral"
  value: string
}
interface NumericLiteral {
  type: "NumericLiteral"
  value: number
}
interface ObjectExpression {
  type: "ObjectExpression"
  properties: ObjectProperty[]
}
interface ObjectProperty {
  type: "ObjectProperty"
  key: Identifier
  value: StringLiteral | NumericLiteral
}
interface Identifier {
  type: "Identifier"
  name: string
}
interface BlockStatement {
  type: "BlockStatement"
  body: Statement[]
}
interface ReturnStatement {
  type: "ReturnStatement"
  argument: Expression | null
}
interface ExpressionStatement {
  type: "ExpressionStatement"
  expression: Expression
}
interface ExportDefaultDeclaration {
  type: "ExportDefaultDeclaration"
  declaration: FunctionDeclaration | ArrowFunctionExpression
}
interface FunctionDeclaration {
  type: "FunctionDeclaration"
  body: BlockStatement | null
}
interface VariableDeclaration {
  type: "VariableDeclaration"
  declarations: VariableDeclarator[]
}
interface VariableDeclarator {
  type: "VariableDeclarator"
  init: ArrowFunctionExpression | null
}
interface ArrowFunctionExpression {
  type: "ArrowFunctionExpression"
  body: BlockStatement | Expression
}
interface ConditionalExpression {
  type: "ConditionalExpression"
  consequent: Expression
}
interface LogicalExpression {
  type: "LogicalExpression"
  operator: string
  right: Expression
}
interface CallExpression {
  type: "CallExpression"
  callee: MemberExpression
  arguments: (ArrowFunctionExpression | FunctionExpressionNode)[]
}
interface MemberExpression {
  type: "MemberExpression"
  property: Identifier
}
interface FunctionExpressionNode {
  type: "FunctionExpression"
  body: BlockStatement
}
type Expression = JSXElement | JSXFragment | StringLiteral | NumericLiteral | ConditionalExpression | LogicalExpression | CallExpression | ObjectExpression
type Statement = ReturnStatement | ExpressionStatement | ExportDefaultDeclaration | FunctionDeclaration | VariableDeclaration

const MAX_INPUT_SIZE = 50 * 1024
const MAX_NESTING_DEPTH = 50
const SAFE_URL_PATTERN = /^(https?:\/\/|data:image\/|\/)/

export interface ImportResult {
  elements: ElementTemplate[]
  warnings: string[]
}

export function importJSX(code: string): ImportResult {
  let elementCounter = 0
  const warnings: string[] = []

  if (code.length > MAX_INPUT_SIZE) {
    return { elements: [], warnings: ["Input exceeds 50KB limit"] }
  }

  let ast: any
  try {
    ast = parse(code, {
      plugins: ["jsx", "typescript"],
      sourceType: "module",
      errorRecovery: true,
    })
  } catch (e) {
    return { elements: [], warnings: [`Parse error: ${(e as Error).message}`] }
  }

  const jsxRoot = findJSXRoot(ast)
  if (!jsxRoot) {
    return { elements: [], warnings: ["No JSX found in the provided code"] }
  }

  const nextId = () => elementCounter++
  const elements = walkNode(jsxRoot, warnings, nextId)
  return { elements, warnings }
}

function findJSXRoot(ast: any): JSXElement | JSXFragment | null {
  // Look for default export function return
  for (const node of ast.program.body) {
    if (node.type === "ExportDefaultDeclaration") {
      const decl = node.declaration
      if (decl.type === "FunctionDeclaration" && decl.body) {
        const jsx = findJSXInBlock(decl.body)
        if (jsx) return jsx
      } else if (decl.type === "ArrowFunctionExpression") {
        if (decl.body.type === "BlockStatement") {
          const jsx = findJSXInBlock(decl.body)
          if (jsx) return jsx
        } else if (isJSXNode(decl.body)) {
          return decl.body as any
        }
      }
    }
  }

  // Look for any function return
  for (const node of ast.program.body) {
    if (node.type === "FunctionDeclaration" && node.body) {
      const jsx = findJSXInBlock(node.body)
      if (jsx) return jsx
    } else if (node.type === "VariableDeclaration") {
      for (const decl of node.declarations) {
        if (decl.init?.type === "ArrowFunctionExpression") {
          const arrow = decl.init
          if (arrow.body.type === "BlockStatement") {
            const jsx = findJSXInBlock(arrow.body)
            if (jsx) return jsx
          } else if (isJSXNode(arrow.body)) {
            return arrow.body as any
          }
        }
      }
    }
  }

  // Look for top-level JSX
  for (const node of ast.program.body) {
    if (node.type === "ExpressionStatement" && isJSXNode(node.expression)) {
      return node.expression as any
    }
  }

  return null
}

function findJSXInBlock(block: any): JSXElement | JSXFragment | null {
  for (const stmt of block.body) {
    if (stmt.type === "ReturnStatement" && stmt.argument && isJSXNode(stmt.argument)) {
      return stmt.argument as any
    }
  }
  return null
}

function isJSXNode(node: any): boolean {
  return node.type === "JSXElement" || node.type === "JSXFragment"
}

function walkNode(node: any, warnings: string[], nextId: () => number, depth = 0): ElementTemplate[] {
  if (depth > MAX_NESTING_DEPTH) {
    warnings.push(`Max nesting depth (${MAX_NESTING_DEPTH}) exceeded, skipping deeper elements`)
    return []
  }
  if (node.type === "JSXElement") {
    const elem = walkJSXElement(node, warnings, nextId, depth)
    return elem ? [elem] : []
  } else if (node.type === "JSXFragment") {
    const children: ElementTemplate[] = []
    for (const child of node.children) {
      children.push(...walkNode(child, warnings, nextId, depth))
    }
    return children
  } else if (node.type === "JSXText") {
    return []
  } else if (node.type === "JSXExpressionContainer") {
    const expr = node.expression
    if (expr.type === "JSXEmptyExpression") {
      return []
    } else if (expr.type === "StringLiteral") {
      return []
    } else if (isJSXNode(expr)) {
      return walkNode(expr, warnings, nextId, depth)
    } else if (expr.type === "ConditionalExpression") {
      return walkNode(expr.consequent, warnings, nextId, depth)
    } else if (expr.type === "LogicalExpression" && expr.operator === "&&") {
      return walkNode(expr.right, warnings, nextId, depth)
    } else if (expr.type === "CallExpression") {
      // Handle .map() pattern
      const callee = expr.callee
      if (callee.type === "MemberExpression" && callee.property.type === "Identifier" && callee.property.name === "map") {
        const arg = expr.arguments[0]
        if (arg && (arg.type === "ArrowFunctionExpression" || arg.type === "FunctionExpression")) {
          const arrow = arg
          if (arrow.body.type === "BlockStatement") {
            const jsx = findJSXInBlock(arrow.body)
            if (jsx) return walkNode(jsx, warnings, nextId, depth)
          } else if (isJSXNode(arrow.body)) {
            return walkNode(arrow.body, warnings, nextId, depth)
          }
        }
      }
    }
    return []
  }
  return []
}

function walkJSXElement(node: any, warnings: string[], nextId: () => number, depth: number): ElementTemplate | null {
  const tagName = getTagName(node.openingElement.name)
  if (!tagName) return null

  const mapping = getComponentMapping(tagName)
  if (isUnknownComponent(tagName)) {
    warnings.push(`Unknown component: ${tagName}, using div fallback`)
  }

  // Extract props
  const className = getAttributeValue(node.openingElement.attributes, "className")
  const inlineStyle = extractInlineStyle(node.openingElement.attributes)
  const props: Record<string, unknown> = {}

  // Extract shadcn/ui props
  const variant = getAttributeValue(node.openingElement.attributes, "variant")
  const size = getAttributeValue(node.openingElement.attributes, "size")
  const placeholder = getAttributeValue(node.openingElement.attributes, "placeholder")
  const type = getAttributeValue(node.openingElement.attributes, "type")
  const disabled = getBooleanAttribute(node.openingElement.attributes, "disabled")
  const checked = getBooleanAttribute(node.openingElement.attributes, "checked")
  const value = getAttributeValue(node.openingElement.attributes, "value")
  const src = getAttributeValue(node.openingElement.attributes, "src")
  const alt = getAttributeValue(node.openingElement.attributes, "alt")

  if (variant) props.variant = variant
  if (size) props.size = size
  if (placeholder) props.placeholder = placeholder
  if (type) props.type = type
  if (disabled !== null) props.disabled = disabled
  if (checked !== null) props.checked = checked
  if (value) props.value = value
  if (src) {
    if (SAFE_URL_PATTERN.test(src)) {
      props.src = src
    } else {
      warnings.push(`Blocked unsafe URL in src attribute: ${src.slice(0, 50)}`)
    }
  }
  if (alt) props.alt = alt

  // Parse Tailwind classes
  const tw = className ? parseTailwindClasses(className) : { style: {}, layout: {} }

  // Determine effective type: div with only text children → treat as text
  let effectiveType = mapping.type
  if (mapping.type === "div") {
    const hasJSXChildren = node.children.some((c: any) => c.type === "JSXElement" || c.type === "JSXFragment" || (c.type === "JSXExpressionContainer" && isJSXNode(c.expression)))
    if (!hasJSXChildren) {
      const text = extractTextContent(node.children)
      if (text) effectiveType = "text"
    }
  }

  // Extract text content for text/button types
  let textContent = ""
  if (effectiveType === "text" || mapping.type === "sc:button") {
    textContent = extractTextContent(node.children)
  }

  // Walk children (unless it's a leaf node)
  const childElements: ElementTemplate[] = []
  if (effectiveType !== "text" && mapping.type !== "sc:button" && !mapping.type.startsWith("sc:")) {
    for (const child of node.children) {
      childElements.push(...walkNode(child, warnings, nextId, depth + 1))
    }
  } else if (mapping.type.startsWith("sc:") && mapping.type !== "sc:button") {
    // Some sc: components might have children (e.g., sc:card, sc:tabs)
    // For now, skip children for all sc: types
  }

  // Set content/label prop for text types
  if (effectiveType === "text" && textContent) {
    props.content = textContent
  } else if (mapping.type === "sc:button" && textContent) {
    props.label = textContent
  }

  const template: ElementTemplate = {
    type: effectiveType,
    name: generateName(effectiveType === "text" ? "text" : tagName, nextId()),
    style: {
      position: "relative" as const,
      left: undefined,
      top: undefined,
      ...mapping.defaultStyle,
      ...tw.style,
      ...inlineStyle,
    },
    props,
    locked: false,
    visible: true,
    layoutMode: tw.layout.layoutMode ?? "none",
    layoutProps: {
      ...DEFAULT_LAYOUT_PROPS,
      direction: tw.layout.direction ?? DEFAULT_LAYOUT_PROPS.direction,
      gap: tw.layout.gap ?? DEFAULT_LAYOUT_PROPS.gap,
      alignItems: (tw.layout.alignItems as any) ?? DEFAULT_LAYOUT_PROPS.alignItems,
      justifyContent: (tw.layout.justifyContent as any) ?? DEFAULT_LAYOUT_PROPS.justifyContent,
      paddingTop: tw.layout.padding?.top ?? DEFAULT_LAYOUT_PROPS.paddingTop,
      paddingRight: tw.layout.padding?.right ?? DEFAULT_LAYOUT_PROPS.paddingRight,
      paddingBottom: tw.layout.padding?.bottom ?? DEFAULT_LAYOUT_PROPS.paddingBottom,
      paddingLeft: tw.layout.padding?.left ?? DEFAULT_LAYOUT_PROPS.paddingLeft,
    },
    sizing: { ...DEFAULT_SIZING, ...tw.layout.sizing },
    canvasPosition: null,
    children: childElements,
  }

  return template
}

function getTagName(name: any): string | null {
  if (name.type === "JSXIdentifier") {
    return name.name
  } else if (name.type === "JSXMemberExpression") {
    // Handle <Card.Header> etc.
    const parts: string[] = []
    let current: any = name
    while (current.type === "JSXMemberExpression") {
      if (current.property.type === "JSXIdentifier") {
        parts.unshift(current.property.name)
      }
      current = current.object
    }
    if (current.type === "JSXIdentifier") {
      parts.unshift(current.name)
    }
    return parts.join("")
  }
  return null
}

function getAttributeValue(attributes: any[], name: string): string | null {
  for (const attr of attributes) {
    if (attr.type === "JSXAttribute" && attr.name.type === "JSXIdentifier" && attr.name.name === name) {
      if (attr.value?.type === "StringLiteral") {
        return attr.value.value
      } else if (attr.value?.type === "JSXExpressionContainer") {
        const expr = attr.value.expression
        if (expr.type === "StringLiteral") {
          return expr.value
        } else if (expr.type === "NumericLiteral") {
          return String(expr.value)
        }
      }
    }
  }
  return null
}

function getBooleanAttribute(attributes: any[], name: string): boolean | null {
  for (const attr of attributes) {
    if (attr.type === "JSXAttribute" && attr.name.type === "JSXIdentifier" && attr.name.name === name) {
      if (attr.value === null) {
        return true // <Switch checked /> — no value means true
      } else if (attr.value?.type === "JSXExpressionContainer") {
        const expr = attr.value.expression
        if (expr.type === "BooleanLiteral") {
          return expr.value // <Switch checked={true} />
        }
        if (expr.type === "Identifier") {
          if (expr.name === "true") return true
          if (expr.name === "false") return false
        }
      }
    }
  }
  return null
}

const DANGEROUS_STYLE_PATTERN = /javascript:|expression\s*\(|-moz-binding/i

function extractInlineStyle(attributes: any[]): Partial<CSSProperties> {
  const style: Partial<CSSProperties> = {}
  for (const attr of attributes) {
    if (attr.type === "JSXAttribute" && attr.name.type === "JSXIdentifier" && attr.name.name === "style") {
      if (attr.value?.type === "JSXExpressionContainer") {
        const expr = attr.value.expression
        if (expr.type === "ObjectExpression") {
          for (const prop of expr.properties) {
            if (prop.type === "ObjectProperty" && prop.key.type === "Identifier") {
              const key = prop.key.name
              if (prop.value.type === "StringLiteral") {
                const val = prop.value.value
                if (DANGEROUS_STYLE_PATTERN.test(val)) continue
                ;(style as any)[key] = val
              } else if (prop.value.type === "NumericLiteral") {
                ;(style as any)[key] = prop.value.value
              }
            }
          }
        }
      }
    }
  }
  return style
}

function extractTextContent(children: any[]): string {
  let text = ""
  for (const child of children) {
    if (child.type === "JSXText") {
      const trimmed = child.value.trim()
      if (trimmed) text += (text ? " " : "") + trimmed
    } else if (child.type === "JSXExpressionContainer") {
      const expr = child.expression
      if (expr.type === "StringLiteral") {
        text += expr.value
      } else if (expr.type === "NumericLiteral") {
        text += String(expr.value)
      }
    } else if (child.type === "JSXElement" || child.type === "JSXFragment") {
      const nested = extractTextContent(child.children)
      if (nested) text += (text ? " " : "") + nested
    }
  }
  return text.trim()
}

function generateName(tagName: string, index: number): string {
  if (tagName === "div" || tagName === "text" || tagName === "image") {
    return `${tagName}-${index}`
  }
  return tagName
}
