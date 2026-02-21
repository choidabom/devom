"use client"

import { useCallback, useState } from "react"
import type { DragControls } from "framer-motion"
import "../../styles/guestbook.css"
import { useGuestbook } from "../../hooks/useGuestbook"
import { EmptyState } from "./EmptyState"
import { GuestbookHeader } from "./GuestbookHeader"
import { GuestbookInput } from "./GuestbookInput"
import { GuestbookMessage } from "./GuestbookMessage"

interface GuestbookProps {
  onClose?: () => void
  isFloating?: boolean
  hideHeader?: boolean
  dragControls?: DragControls
}

export const Guestbook = ({ onClose, isFloating, hideHeader, dragControls }: GuestbookProps = {}) => {
  const { entries, loading, userName, messagesEndRef, setUserName, addEntry, shouldShowAvatar, isMyMessage } = useGuestbook()
  const [message, setMessage] = useState("")

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!message.trim()) return

      await addEntry(message, userName)
      setMessage("")
    },
    [message, userName, addEntry]
  )

  return (
    <div className={`imessage-container ${isFloating ? "floating" : ""}`}>
      {!hideHeader && <GuestbookHeader onClose={onClose} isFloating={isFloating} messageCount={entries.length} dragControls={dragControls} />}

      <div className="imessage-messages">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <div style={{ fontSize: 14, color: "#8e8e93" }}>Loading messages...</div>
          </div>
        ) : entries.length === 0 ? (
          <EmptyState />
        ) : (
          entries.map((entry, index) => {
            const isMe = isMyMessage(entry.id)
            const showAvatar = shouldShowAvatar(index)
            return <GuestbookMessage key={entry.id} entry={entry} index={index} isMe={isMe} showAvatar={showAvatar} />
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <GuestbookInput message={message} userName={userName} onMessageChange={setMessage} onNameChange={setUserName} onSubmit={handleSubmit} />
    </div>
  )
}
