import type { EditorElement } from "../types"

export function exportToJSON(elements: Record<string, EditorElement>, rootId: string): string {
  return JSON.stringify({ elements, rootId }, null, 2)
}
