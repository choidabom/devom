import type { CSSProperties } from "react"
import type { EditorElement } from "../types"

/**
 * Compute CSS properties for a flex container from its layoutProps.
 */
export function getContainerStyles(element: EditorElement): CSSProperties {
  if (element.layoutMode !== 'flex') return {}
  const lp = element.layoutProps
  return {
    display: 'flex',
    flexDirection: lp.direction,
    gap: lp.gap,
    paddingTop: lp.paddingTop,
    paddingRight: lp.paddingRight,
    paddingBottom: lp.paddingBottom,
    paddingLeft: lp.paddingLeft,
    alignItems: lp.alignItems === 'start' ? 'flex-start'
      : lp.alignItems === 'end' ? 'flex-end'
      : lp.alignItems,
    justifyContent: lp.justifyContent === 'start' ? 'flex-start'
      : lp.justifyContent === 'end' ? 'flex-end'
      : lp.justifyContent === 'space-between' ? 'space-between'
      : lp.justifyContent,
  }
}

/**
 * Compute CSS properties for a child inside an auto-layout container.
 * parentDirection determines which axis is the main axis.
 */
export function getChildSizingStyles(
  child: EditorElement,
  parentDirection: 'row' | 'column',
): CSSProperties {
  const styles: CSSProperties = {}
  const { w, h } = child.sizing

  const mainSizing = parentDirection === 'row' ? w : h
  const crossSizing = parentDirection === 'row' ? h : w
  const mainDim = parentDirection === 'row' ? 'width' : 'height'
  const crossDim = parentDirection === 'row' ? 'height' : 'width'

  if (mainSizing === 'fill') {
    styles.flex = '1 0 0'
    styles[mainDim] = undefined
  } else if (mainSizing === 'hug') {
    styles[mainDim] = 'fit-content'
  }

  if (crossSizing === 'fill') {
    styles.alignSelf = 'stretch'
    styles[crossDim] = undefined
  } else if (crossSizing === 'hug') {
    styles[crossDim] = 'fit-content'
  }

  return styles
}

/**
 * Check if an element is inside an auto-layout container.
 */
export function isAutoLayoutChild(
  element: EditorElement,
  getElement: (id: string) => EditorElement | undefined,
): boolean {
  if (!element.parentId) return false
  const parent = getElement(element.parentId)
  return parent?.layoutMode === 'flex'
}
