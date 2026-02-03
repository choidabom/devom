"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"

import "@/styles/context-menu.css"

type MenuItem =
  | {
      label: string
      icon?: string
      onClick?: () => void
      checked?: boolean
      disabled?: boolean
      submenu?: MenuItem[]
      divider?: never
    }
  | {
      divider: true
      label?: never
      icon?: never
      onClick?: never
      checked?: never
      disabled?: never
      submenu?: never
    }

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  showCalendar: boolean
  onCalendarToggle: () => void
}

export const ContextMenu = ({ x, y, onClose, showCalendar, onCalendarToggle }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x, y })
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const handleClick = () => onClose()
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      onClose()
    }

    document.addEventListener("click", handleClick)
    document.addEventListener("contextmenu", handleContextMenu)

    return () => {
      document.removeEventListener("click", handleClick)
      document.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [onClose])

  // Adjust position to keep menu within viewport
  useEffect(() => {
    if (!menuRef.current) return

    const rect = menuRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let adjustedX = x
    let adjustedY = y

    // Check if menu goes off right edge
    if (x + rect.width > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 10
    }

    // Check if menu goes off bottom edge
    if (y + rect.height > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 10
    }

    // Check if menu goes off left edge
    if (adjustedX < 10) {
      adjustedX = 10
    }

    // Check if menu goes off top edge
    if (adjustedY < 10) {
      adjustedY = 10
    }

    setPosition({ x: adjustedX, y: adjustedY })
  }, [x, y])

  const menuItems: MenuItem[] = [
    {
      label: showCalendar ? "Hide Calendar" : "Show Calendar",
      onClick: onCalendarToggle,
    },
    {
      label: "Toggle Dark Mode",
      onClick: () => setTheme(theme === "light" ? "dark" : "light"),
    },
    { divider: true },
    {
      label: "View Source",
      onClick: () => window.open("https://github.com/choidabom/devom", "_blank"),
    },
    {
      label: "Refresh",
      onClick: () => window.location.reload(),
    },
  ]

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        left: position.x,
        top: position.y,
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {menuItems.map((item, index) => {
        if (item.divider) {
          return <div key={`divider-${index}`} className="context-menu-divider" />
        }

        return (
          <div
            key={index}
            className={`context-menu-item ${item.disabled ? "disabled" : ""} ${item.submenu ? "has-submenu" : ""}`}
            onClick={() => {
              if (!item.disabled && item.onClick) {
                item.onClick()
                onClose()
              }
            }}
            onMouseEnter={(e) => {
              if (item.submenu) {
                // Check if submenu would overflow viewport and adjust position
                const submenu = e.currentTarget.querySelector(".context-menu-submenu") as HTMLElement
                if (submenu) {
                  // Reset position first
                  submenu.style.left = "100%"
                  submenu.style.right = "auto"
                  submenu.style.marginLeft = "2px"
                  submenu.style.marginRight = "0"

                  // Check if it overflows
                  setTimeout(() => {
                    const rect = submenu.getBoundingClientRect()
                    if (rect.right > window.innerWidth - 10) {
                      // Flip to left
                      submenu.style.left = "auto"
                      submenu.style.right = "100%"
                      submenu.style.marginLeft = "0"
                      submenu.style.marginRight = "2px"
                    }
                  }, 0)
                }
              }
            }}
          >
            {item.icon && <span className="context-menu-icon">{item.icon}</span>}
            <span className="context-menu-label">{item.label}</span>
            {item.submenu && <span className="context-menu-arrow">▶</span>}
            {item.submenu && (
              <div className="context-menu-submenu">
                {item.submenu.map((subItem, subIndex) => (
                  <div
                    key={subIndex}
                    className="context-menu-item"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (subItem.onClick) {
                        subItem.onClick()
                        onClose()
                      }
                    }}
                  >
                    <span className="context-menu-label">{subItem.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
