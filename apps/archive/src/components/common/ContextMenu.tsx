"use client"

import { useEffect, useRef, useState } from "react"
import "@/styles/context-menu.css"

type LayoutMode = "free" | "centered"

interface MenuItem {
  label: string
  icon?: string
  onClick?: () => void
  divider?: boolean
  checked?: boolean
  disabled?: boolean
  submenu?: MenuItem[]
}

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  layout: LayoutMode
  onLayoutChange: (mode: LayoutMode) => void
  showCalendar: boolean
  onCalendarToggle: () => void
  onArrangeCards: (mode: "grid" | "circle" | "cascade") => void
  onRestoreAll: () => void
}

export const ContextMenu = ({ x, y, onClose, layout, onLayoutChange, showCalendar, onCalendarToggle, onArrangeCards, onRestoreAll }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x, y })

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
      label: "Arrange Cards",
      icon: "📐",
      submenu: [
        { label: "Grid", onClick: () => onArrangeCards("grid") },
        { label: "Circle", onClick: () => onArrangeCards("circle") },
        { label: "Cascade", onClick: () => onArrangeCards("cascade") },
      ],
    },
    { label: "Restore All", icon: "↩️", onClick: onRestoreAll },
    { divider: true },
    {
      label: "Free Mode",
      icon: layout === "free" ? "✓" : "",
      onClick: () => onLayoutChange("free"),
      checked: layout === "free",
    },
    {
      label: "Centered Mode",
      icon: layout === "centered" ? "✓" : "",
      onClick: () => onLayoutChange("centered"),
      checked: layout === "centered",
    },
    { divider: true },
    {
      label: showCalendar ? "Hide Calendar" : "Show Calendar",
      icon: "📅",
      onClick: onCalendarToggle,
      disabled: layout !== "free",
    },
    {
      label: "Toggle Dark Mode",
      icon: "🌙",
      onClick: () => {
        const currentTheme = document.documentElement.getAttribute("data-theme")
        const newTheme = currentTheme === "light" ? "dark" : "light"
        document.documentElement.setAttribute("data-theme", newTheme)
        localStorage.setItem("devom-theme", newTheme)
      },
    },
    { divider: true },
    {
      label: "View Source",
      icon: "🔗",
      onClick: () => window.open("https://github.com/dabom-choi/devom", "_blank"),
    },
    {
      label: "Refresh",
      icon: "🔄",
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
            <span className="context-menu-icon">{item.icon}</span>
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
