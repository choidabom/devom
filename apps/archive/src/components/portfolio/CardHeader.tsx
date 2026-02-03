"use client"

import { memo } from "react"

import { RightArrow, UpRightArrow } from "@/components/icon/Arrows"
import { PortfolioWork } from "@/types/portfolio"

interface CardHeaderProps {
  item: PortfolioWork
  index: number
  onClose?: (index: number) => void
  onMinimize?: (index: number) => void
  onMaximize?: (index: number) => void
  onTitleClick?: () => void
  onShowTooltip?: (position: { x: number; y: number }, message?: string) => void
  isMaximized?: boolean
  onDoubleClick?: () => void
}

export const CardHeader = memo(({ item, index, onClose, onMinimize, onMaximize, onTitleClick, onShowTooltip, isMaximized, onDoubleClick }: CardHeaderProps) => {
  return (
    <div
      className="card-header"
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement
        if (target.closest("a,button")) return
        onDoubleClick?.()
      }}
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
            className={`window-control-btn window-control-minimize ${isMaximized ? "maximized" : ""}`}
            aria-label="Minimize"
            onClick={(e) => {
              e.stopPropagation()
              onMinimize?.(index)
            }}
            onDoubleClick={(e) => e.stopPropagation()}
          />
          <button
            className="window-control-btn window-control-maximize"
            aria-label="Maximize"
            onClick={(e) => {
              e.stopPropagation()
              onMaximize?.(index)
            }}
            onDoubleClick={(e) => e.stopPropagation()}
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
          onShowTooltip?.(
            {
              x: rect.right + 10,
              y: rect.top + rect.height / 2 - 15,
            },
            item.tooltipMessage
          )
        }}
        style={{ cursor: "pointer" }}
      >
        <span>{item.id}</span>
        {item.external ? <UpRightArrow /> : <RightArrow />}
      </a>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {item.status && (
          <div className="status-indicator" title={`Status: ${item.status}`}>
            <span className={`status-dot ${item.status}`} />
            <span className="status-text">{item.status}</span>
          </div>
        )}
        {item.year && <span className="card-name card-year">{item.year}</span>}
      </div>
    </div>
  )
})

CardHeader.displayName = "CardHeader"
