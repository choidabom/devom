import { useContext } from "react"
import { GuestbookContext } from "../../context/GuestbookContext"

export const GuestbookIcon = () => {
  const { openGuestbook } = useContext(GuestbookContext)

  return (
    <div
      className="desktop-icon"
      onClick={openGuestbook}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          openGuestbook()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Guestbook"
    >
      <span className="guestbook-icon-emoji">📖</span>
    </div>
  )
}
