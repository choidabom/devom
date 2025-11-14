/**
 * Common type definitions shared across the application
 */

/** 2D position coordinates */
export interface Position {
  x: number | string
  y: number | string
}

/** Dimensions */
export interface Size {
  width: number
  height: number
}

/** Rectangle combining position and size */
export interface Rect extends Position, Size {}

/** Window/Card state */
export interface WindowState {
  isClosed: boolean
  isMinimized: boolean
  isMaximized: boolean
  isAnimating: boolean
}

/** Content type discriminator */
export type ContentType = "image" | "iframe" | "component"

/** Category definition */
export interface Category {
  id: string
  name: string
  count?: number
}
