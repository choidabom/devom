import type { CSSProperties } from "react"
import type { EditorElement } from "../types"

/**
 * Compute CSS properties for a flex container from its layoutProps.
 */
export function getContainerStyles(element: EditorElement): CSSProperties {
  if (element.layoutMode === 'flex') {
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
      ...(lp.flexWrap === 'wrap' ? { flexWrap: 'wrap' as const } : {}),
    }
  }

  if (element.layoutMode === 'grid' && element.gridProps) {
    const g = element.gridProps
    return {
      display: 'grid' as const,
      gridTemplateColumns: g.minColumnWidth
        ? `repeat(auto-fit, minmax(${g.minColumnWidth}px, 1fr))`
        : `repeat(${g.columns}, 1fr)`,
      gap: g.gap,
    }
  }

  return {}
}

/**
 * Compute CSS properties for a child inside an auto-layout container.
 * parentDirection determines which axis is the main axis.
 */
export function getChildSizingStyles(
  child: EditorElement,
  parentDirection: 'row' | 'column',
  parentFlexWrap?: 'nowrap' | 'wrap',
): CSSProperties {
  const styles: CSSProperties = {}
  const { w, h } = child.sizing

  const mainSizing = parentDirection === 'row' ? w : h
  const crossSizing = parentDirection === 'row' ? h : w
  const mainDim = parentDirection === 'row' ? 'width' : 'height'
  const crossDim = parentDirection === 'row' ? 'height' : 'width'

  if (mainSizing === 'fill') {
    const minW = parentFlexWrap === 'wrap' && typeof child.style.minWidth === 'number' ? child.style.minWidth : 0
    styles.flex = `1 0 ${minW}px`
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
  return parent?.layoutMode === 'flex' || parent?.layoutMode === 'grid'
}

export function getSectionStyles(element: EditorElement): CSSProperties {
  if (!element.sectionProps) return {}
  const s = element.sectionProps
  const styles: CSSProperties = {}
  if (s.backgroundColor) styles.backgroundColor = s.backgroundColor
  if (s.backgroundImage) styles.backgroundImage = `url(${s.backgroundImage})`
  if (s.verticalPadding != null) {
    styles.paddingTop = s.verticalPadding
    styles.paddingBottom = s.verticalPadding
  }
  return styles
}

export function getSectionContentStyles(element: EditorElement): CSSProperties {
  if (!element.sectionProps?.maxWidth) return {}
  return {
    maxWidth: element.sectionProps.maxWidth,
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '100%',
  }
}
