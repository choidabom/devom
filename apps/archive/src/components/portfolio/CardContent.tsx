"use client"

import { memo, ReactNode } from "react"

import { PortfolioWork } from "@/types/portfolio"

interface CardContentProps {
  item: PortfolioWork
  onGuestbookClick?: () => void
  isTopmost?: boolean
  onBringToFront?: () => void
}

export const CardContent = memo(({ item, onGuestbookClick, isTopmost = true, onBringToFront }: CardContentProps) => {
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
            width: "100%",
            height: "100%",
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
            width: "100%",
            height: "100%",
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
          {/* Overlay to catch clicks when card is not topmost */}
          {!isTopmost && (
            <div
              className="iframe-overlay"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onBringToFront?.()
              }}
              onTouchStart={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onBringToFront?.()
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "transparent",
                cursor: "pointer",
                zIndex: 10,
                pointerEvents: "auto",
              }}
            />
          )}
        </div>
      )
    }

    if (item.contentType === "component" && item.component) {
      const Component = item.component
      return (
        <div
          className="card-component"
          style={{
            width: "100%",
            height: "100%",
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
