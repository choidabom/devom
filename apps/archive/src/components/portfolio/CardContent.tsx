"use client"

import { memo, ReactNode } from "react"
import { PortfolioWork } from "@/types/portfolio"

interface CardContentProps {
  item: PortfolioWork
  onGuestbookClick?: () => void
}

export const CardContent = memo(({ item, onGuestbookClick }: CardContentProps) => {
  const handleImageClick = (e: React.MouseEvent) => {
    if (onGuestbookClick) {
      e.stopPropagation()
      onGuestbookClick()
    }
  }

  const renderContent = (): ReactNode => {
    if (item.contentType === "image" && item.img_url) {
      return (
        <img
          src={item.img_url}
          alt={item.id}
          draggable={false}
          className={`card-image `}
          onClick={handleImageClick}
          onMouseDown={(e) => onGuestbookClick && e.stopPropagation()}
          style={{
            cursor: onGuestbookClick ? "pointer" : "default",
            width: `${item.width}px`,
            height: `${item.height}px`,
            objectFit: "cover",
            display: "block",
          }}
        />
      )
    }

    if (item.contentType === "iframe" && item.iframe_url) {
      return (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: item.width,
            height: item.height,
            position: "relative",
          }}
        >
          <iframe
            src={item.iframe_url}
            className="card-image"
            title={item.id}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-downloads allow-modals"
            loading="eager"
            allow="clipboard-write"
            referrerPolicy="strict-origin-when-cross-origin"
            style={{
              width: "100%",
              height: "100%",
              border: 0,
              isolation: "isolate",
              pointerEvents: "auto",
            }}
          />
        </div>
      )
    }

    if (item.contentType === "component" && item.component) {
      const Component = item.component
      return (
        <div
          className="card-component"
          style={{
            width: item.width,
            height: item.height,
            position: "relative",
            overflow: "hidden",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <Component />
        </div>
      )
    }

    return null
  }

  return <>{renderContent()}</>
})

CardContent.displayName = "CardContent"
