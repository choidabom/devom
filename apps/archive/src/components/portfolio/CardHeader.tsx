import { DragControls } from "framer-motion"
import { memo } from "react"
import { PortfolioWork } from "../../types/portfolio"
import { RightArrow, UpRightArrow } from "../icon/Arrows"

interface CardHeaderProps {
  item: PortfolioWork
  index: number
  onClose?: (index: number) => void
  onMinimize?: (index: number) => void
  onMaximize?: (index: number) => void
  onTitleClick?: () => void
  dragControls?: DragControls
}

export const CardHeader = memo(({ item, index, onClose, onMinimize, onMaximize, onTitleClick, dragControls }: CardHeaderProps) => {
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
          // If it has a description and no url, show detail card
          if (item.description && !item.url) {
            e.preventDefault()
            onTitleClick?.()
          }
          // If it has both, let the link work naturally (our router will handle it)
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
