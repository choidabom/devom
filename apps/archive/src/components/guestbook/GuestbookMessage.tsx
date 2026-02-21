"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { GuestbookEntry } from "../../types/guestbook"
import { formatTime } from "../../utils/guestbook"

interface GuestbookMessageProps {
  entry: GuestbookEntry
  index: number
  isMe: boolean
  showAvatar: boolean
}

export const GuestbookMessage = memo(({ entry, index, isMe, showAvatar }: GuestbookMessageProps) => {
  return (
    <motion.div
      key={entry.id}
      className={`message-group ${isMe ? "me" : "them"} ${!showAvatar ? "grouped" : ""}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <div className="message-content">
        {!isMe && showAvatar && <div className="sender-name">{entry.name}</div>}
        <div className="message-bubble">
          <div className="message-text">{entry.message}</div>
        </div>
      </div>
      <div className="message-time">{formatTime(entry.created_at)}</div>
    </motion.div>
  )
})

GuestbookMessage.displayName = "GuestbookMessage"
