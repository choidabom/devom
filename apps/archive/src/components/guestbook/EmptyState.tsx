import { memo } from "react"

export const EmptyState = memo(() => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">💬</div>
      <div className="empty-state-title">No messages yet</div>
      <div className="empty-state-description">Be the first to leave a message!</div>
    </div>
  )
})

EmptyState.displayName = "EmptyState"
