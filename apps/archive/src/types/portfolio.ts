import { ComponentType, ReactNode } from "react"

export interface PortfolioWork {
  img_url?: string
  iframe_url?: string
  component?: ComponentType
  id: string
  external: boolean
  year: string
  category: string
  width: number
  height: number
  url: string
  hasControls?: boolean
  contentType: "image" | "iframe" | "component"
  description?: string | ReactNode
  isGuestbook?: boolean
}

export interface CardPosition {
  x: string
  y: string
}
