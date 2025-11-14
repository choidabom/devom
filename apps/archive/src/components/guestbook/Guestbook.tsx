import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import {
  loadGuestbookEntries,
  saveGuestbookEntries,
  loadUserName,
  saveUserName
} from "../../data/guestbook"
import { GuestbookEntry } from "../../types/guestbook"
import "../../styles/guestbook.css"

interface GuestbookProps {
  onClose?: () => void
  isFloating?: boolean
}

export const Guestbook = ({ onClose, isFloating }: GuestbookProps = {}) => {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load entries and user name on mount
  useEffect(() => {
    setEntries(loadGuestbookEntries())
    setName(loadUserName())
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [entries])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    } else if (days === 1) {
      return "Yesterday"
    } else if (days < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" })
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) return

    const userName = name.trim() || "Anonymous"
    const newEntry: GuestbookEntry = {
      id: Date.now().toString(),
      name: userName,
      message: message.trim(),
      date: new Date().toISOString(),
    }

    const updatedEntries = [...entries, newEntry]
    setEntries(updatedEntries)
    saveGuestbookEntries(updatedEntries)

    // Save user name for future use
    if (name.trim()) {
      saveUserName(name.trim())
    }

    setMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className={`imessage-container ${isFloating ? "floating" : ""}`}>
      <div className="imessage-header">
        {isFloating ? (
          <button onClick={onClose} className="back-btn">
            <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
              <path d="M9 1L1 8.5L9 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : (
          <a href="/" className="back-btn">
            <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
              <path d="M9 1L1 8.5L9 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        )}
        <div className="header-info">
          <div className="contact-name">Guestbook</div>
          <div className="contact-status">{entries.length} messages</div>
        </div>
      </div>

      <div className="imessage-messages">
        {entries.map((entry, index) => {
          const isMe = entry.name === (name || "Anonymous")
          return (
            <motion.div
              key={entry.id}
              className={`message-group ${isMe ? "me" : "them"}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="message-bubble">
                {!isMe && <div className="sender-name">{entry.name}</div>}
                <div className="message-text">{entry.message}</div>
              </div>
              <div className="message-time">{formatTime(entry.date)}</div>
            </motion.div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="imessage-input-container">
        {!name && (
          <div className="name-input-wrapper">
            <input
              type="text"
              className="name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              maxLength={30}
            />
          </div>
        )}
        <form className="imessage-input-form" onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <textarea
              className="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="iMessage"
              rows={1}
              maxLength={500}
            />
            <button
              type="submit"
              className="send-btn"
              disabled={!message.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 10L18 2L10 18L8 11L2 10Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
