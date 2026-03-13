import type { ObservableMap } from "mobx"
import { DEFAULT_LAYOUT_PROPS, type CanvasMode, type EditorElement, type PageViewportWidth } from "../../types"

export function switchCanvasMode(
  elements: ObservableMap<string, EditorElement>,
  rootId: string,
  mode: CanvasMode,
  pageViewport: PageViewportWidth,
) {
  const root = elements.get(rootId)
  if (!root) return

  if (mode === 'page') {
    for (const childId of root.children) {
      const child = elements.get(childId)
      if (!child) continue
      child.canvasPosition = {
        left: typeof child.style.left === 'number' ? child.style.left : 0,
        top: typeof child.style.top === 'number' ? child.style.top : 0,
        width: child.style.width,
        sizing: { ...child.sizing },
      }
      const { left, top, position, ...rest } = child.style
      child.style = { ...rest, position: 'relative' as const, width: '100%' }
      child.sizing = { w: 'fill', h: 'hug' }

      if (child.layoutMode === 'flex' && child.layoutProps.direction === 'row') {
        for (const grandchildId of child.children) {
          const gc = elements.get(grandchildId)
          if (!gc) continue
          if (!gc.canvasPosition) {
            gc.canvasPosition = { left: 0, top: 0, width: gc.style.width, sizing: { ...gc.sizing } }
          }
          gc.sizing = { w: gc.sizing.w === 'hug' ? 'hug' : 'fill', h: gc.sizing.h === 'fixed' ? 'hug' : gc.sizing.h }
        }
      }
    }
    root.layoutMode = 'flex'
    root.layoutProps = {
      ...DEFAULT_LAYOUT_PROPS,
      direction: 'column',
      gap: 24,
      paddingTop: 24,
      paddingRight: 32,
      paddingBottom: 32,
      paddingLeft: 32,
      alignItems: 'stretch',
    }
    root.style = {
      ...root.style,
      width: pageViewport,
      height: undefined,
      minHeight: undefined,
      overflow: 'visible',
      backgroundColor: '#ffffff',
    }
  } else {
    for (const childId of root.children) {
      const child = elements.get(childId)
      if (!child) continue
      const pos = child.canvasPosition ?? { left: 0, top: 0 }
      child.style = {
        ...child.style,
        position: 'absolute' as const,
        left: pos.left,
        top: pos.top,
        width: pos.width ?? child.style.width,
      }
      if (pos.sizing) {
        child.sizing = { ...pos.sizing }
      }
      for (const grandchildId of child.children) {
        const gc = elements.get(grandchildId)
        if (!gc || !gc.canvasPosition?.sizing) continue
        gc.sizing = { ...gc.canvasPosition.sizing }
        gc.canvasPosition = null
      }
      child.canvasPosition = null
    }
    root.layoutMode = 'none'
    root.layoutProps = { ...DEFAULT_LAYOUT_PROPS }
    root.style = {
      ...root.style,
      width: undefined,
      height: undefined,
      minHeight: undefined,
      overflow: 'visible',
      backgroundColor: 'transparent',
    }
  }
}
