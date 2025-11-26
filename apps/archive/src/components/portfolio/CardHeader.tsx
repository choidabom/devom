"use client"

import { DragControls } from "framer-motion"
import { memo } from "react"
import { PortfolioWork } from "@/types/portfolio"
import { RightArrow, UpRightArrow } from "@/components/icon/Arrows"

interface CardHeaderProps {
  item: PortfolioWork
  index: number
  onClose?: (index: number) => void
  onMinimize?: (index: number) => void
  onMaximize?: (index: number) => void
  onTitleClick?: () => void
  onShowTooltip?: (position: { x: number; y: number }) => void
  dragControls?: DragControls
}

export const CardHeader = memo(({ item, index, onClose, onMinimize, onMaximize, onTitleClick, onShowTooltip, dragControls }: CardHeaderProps) => {
  return (
    <div
      className="card-header"
      onPointerDown={(event) => {
        const target = event.target as HTMLElement
        if (target.closest("a,button")) return
        dragControls?.start(event)
      }}
      style={{ cursor: "grab" }}
    >
      {item.hasControls && (
        <div className="window-controls">
          <button
            className="window-control-btn window-control-close"
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation()
              onClose?.(index)
            }}
          />
          <button
            className="window-control-btn window-control-minimize"
            aria-label="Minimize"
            onClick={(e) => {
              e.stopPropagation()
              onMinimize?.(index)
            }}
          />
          <button
            className="window-control-btn window-control-maximize"
            aria-label="Maximize"
            onClick={(e) => {
              e.stopPropagation()
              onMaximize?.(index)
            }}
          />
        </div>
      )}
      <a
        href={item.url}
        className="card-name card-link"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()

          // If it's a guestbook card, use custom handler
          if (item.isGuestbook) {
            onTitleClick?.()
            return
          }

          // If it has a description and no url, show detail card
          if (item.description && !item.url) {
            onTitleClick?.()
            return
          }

          // For all other cards, show tooltip near the clicked element
          const rect = e.currentTarget.getBoundingClientRect()
          onShowTooltip?.({
            x: rect.right + 10,
            y: rect.top + rect.height / 2 - 15,
          })
        }}
        style={{ cursor: "pointer" }}
      >
        <span>{item.id}</span>
        {item.external ? <UpRightArrow /> : <RightArrow />}
      </a>
      <span className="card-name card-year">{item.year}</span>
    </div>
  )
})

CardHeader.displayName = "CardHeader"
