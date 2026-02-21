"use client"

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { LIMITS } from "../../constants/guestbook"

interface GuestbookInputProps {
  message: string
  userName: string
  onMessageChange: (message: string) => void
  onNameChange: (name: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export const GuestbookInput = memo(({ message, userName, onMessageChange, onNameChange, onSubmit }: GuestbookInputProps) => {
  const [showNameInput, setShowNameInput] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [message])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        onSubmit(e as any)
      }
    },
    [onSubmit]
  )

  const handleNameBlur = useCallback(() => {
    setShowNameInput(false)
  }, [])

  return (
    <div className="imessage-input-container">
      <form className="imessage-input-form" onSubmit={onSubmit}>
        <div className="input-wrapper">
          <div className="name-input-wrapper">
            {showNameInput ? (
              <>
                <input
                  type="text"
                  className="name-input"
                  value={userName}
                  onChange={(e) => onNameChange(e.target.value)}
                  onBlur={handleNameBlur}
                  placeholder="Your name"
                  maxLength={LIMITS.NAME_MAX_LENGTH}
                  autoFocus
                />
                <span className="name-char-count">
                  {userName.length}/{LIMITS.NAME_MAX_LENGTH}
                </span>
              </>
            ) : (
              <button type="button" className="name-display" onClick={() => setShowNameInput(true)}>
                {userName || "Anonymous"}
              </button>
            )}
          </div>
          <div className="message-input-row">
            <textarea
              ref={textareaRef}
              className="message-input"
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="안녕하세요감사해요잘있어요다시만나요"
              rows={1}
              maxLength={LIMITS.MESSAGE_MAX_LENGTH}
            />
            <button type="submit" className="send-btn" disabled={!message.trim()}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 10L18 2L10 18L8 11L2 10Z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </form>
      <div className="guestbook-notice">Messages cannot be edited or deleted</div>
    </div>
  )
})

GuestbookInput.displayName = "GuestbookInput"
