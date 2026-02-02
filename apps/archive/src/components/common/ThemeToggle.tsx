"use client"

import { useEffect, useState } from "react"
import "@/styles/theme-toggle.css"

export const ThemeToggle = () => {
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

  // Don't render until mounted to avoid flash
  if (!mounted) {
    return <div className="theme-toggle" style={{ opacity: 0 }} />
  }

  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  )
}
