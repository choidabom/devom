"use client"

import { memo } from "react"
import Link from "next/link"
import type { DragControls } from "framer-motion"

interface GuestbookHeaderProps {
  onClose?: () => void
  isFloating?: boolean
  messageCount: number
  dragControls?: DragControls
}

export const GuestbookHeader = memo(({ onClose, isFloating, messageCount, dragControls }: GuestbookHeaderProps) => {
  return (
    <div
      className="imessage-header"
      onPointerDown={(e) => {
        if (dragControls && isFloating) {
          dragControls.start(e)
        }
      }}
      style={isFloating ? { cursor: "grab" } : undefined}
    >
      {isFloating ? (
        <button onClick={onClose} className="back-btn">
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
            <path d="M9 1L1 8.5L9 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        <Link href="/" className="back-btn">
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
            <path d="M9 1L1 8.5L9 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
      <div className="header-info">
        <div className="contact-name">Guestbook</div>
        <div className="contact-status">{messageCount} messages</div>
      </div>
      <div style={{ width: 28 }} />
    </div>
  )
})

GuestbookHeader.displayName = "GuestbookHeader"
