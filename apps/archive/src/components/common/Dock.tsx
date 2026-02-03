"use client"

import "@/styles/dock.css"
import { useEffect, useState } from "react"

type LayoutMode = "free" | "centered"

interface DockProps {
  layout: LayoutMode
  onLayoutChange: (mode: LayoutMode) => void
  showCalendar: boolean
  onCalendarToggle: () => void
  minimizedCards?: Array<{ index: number; id: string; img_url?: string }>
  onCardRestore?: (index: number) => void
}

export const Dock = ({ layout: _layout, onLayoutChange: _onLayoutChange, showCalendar, onCalendarToggle, minimizedCards = [], onCardRestore }: DockProps) => {
  // Start with light to match server render, then sync with actual theme
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  // Sync with actual theme after hydration
  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme")
    if (currentTheme) {
      setTheme(currentTheme as "light" | "dark")
    }
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.setAttribute("data-theme", newTheme)
    localStorage.setItem("devom-theme", newTheme)
  }

  return (
    <div className="dock-container">
      <div className="dock">
        {/* Calendar Toggle */}
        <button className={`dock-item ${showCalendar ? "active" : ""}`} onClick={onCalendarToggle} title="Toggle Calendar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
            <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Minimized Apps */}
        {minimizedCards.length > 0 && (
          <>
            <div className="dock-divider" />
            {minimizedCards.map((card) => (
              <button key={card.index} className="dock-item dock-minimized-app" onClick={() => onCardRestore?.(card.index)} title={`Restore ${card.id}`}>
                {card.img_url ? (
                  <img src={card.img_url} alt={card.id} className="dock-app-icon" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
                <span className="dock-minimized-indicator" />
              </button>
            ))}
          </>
        )}

        {/* Theme Toggle */}
        <button className="dock-item" onClick={toggleTheme} title={theme === "light" ? "Dark Mode" : "Light Mode"} style={{ opacity: mounted ? 1 : 0 }}>
          {theme === "light" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
              <path
                d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
