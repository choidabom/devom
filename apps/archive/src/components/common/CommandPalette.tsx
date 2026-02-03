"use client"

import { useEffect, useState, useRef } from "react"
import "@/styles/command-palette.css"

interface Command {
  id: string
  title: string
  description: string
  icon: string
  category: string
  keywords: string[]
  shortcut?: string
}

interface CommandPaletteProps {
  layout: "free" | "centered"
  onLayoutChange: (layout: "free" | "centered") => void
  showCalendar: boolean
  onCalendarToggle: () => void
  onArrangeCards: (mode: "grid" | "circle" | "cascade") => void
  onRestoreAll: () => void
}

export const CommandPalette = ({ layout: _layout, onLayoutChange, showCalendar, onCalendarToggle, onArrangeCards, onRestoreAll }: CommandPaletteProps) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands: Command[] = [
    {
      id: "free",
      title: "Switch to Free Layout",
      description: "Draggable cards with flexible positioning",
      icon: "🪟",
      category: "Layout",
      keywords: ["layout", "free", "cards", "drag"],
      shortcut: "⌘ F",
    },
    {
      id: "centered",
      title: "Switch to Centered Layout",
      description: "Vertical scroll layout with centered content",
      icon: "📄",
      category: "Layout",
      keywords: ["layout", "centered", "vertical", "scroll"],
      shortcut: "⌘ C",
    },
    {
      id: "calendar",
      title: showCalendar ? "Hide Calendar" : "Show Calendar",
      description: "Toggle calendar visibility",
      icon: "📅",
      category: "View",
      keywords: ["calendar", "toggle", "view"],
      shortcut: "⌘ L",
    },
    {
      id: "grid",
      title: "Arrange in Grid",
      description: "Organize cards in a grid pattern",
      icon: "⊞",
      category: "Arrange",
      keywords: ["arrange", "grid", "organize"],
    },
    {
      id: "circle",
      title: "Arrange in Circle",
      description: "Organize cards in a circular pattern",
      icon: "◯",
      category: "Arrange",
      keywords: ["arrange", "circle", "organize"],
    },
    {
      id: "cascade",
      title: "Arrange in Cascade",
      description: "Organize cards in a cascading pattern",
      icon: "⚍",
      category: "Arrange",
      keywords: ["arrange", "cascade", "organize"],
    },
    {
      id: "restore",
      title: "Restore All Windows",
      description: "Restore all minimized windows",
      icon: "↕",
      category: "Windows",
      keywords: ["restore", "windows", "minimize"],
      shortcut: "⌘ R",
    },
  ]

  const filteredCommands = commands.filter((cmd) => {
    const searchLower = search.toLowerCase()
    return cmd.title.toLowerCase().includes(searchLower) || cmd.description.toLowerCase().includes(searchLower) || cmd.keywords.some((kw) => kw.includes(searchLower))
  })

  const groupedCommands = filteredCommands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = []
      acc[cmd.category]!.push(cmd)
      return acc
    },
    {} as Record<string, Command[]>
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((open) => !open)
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === "Escape") {
        setOpen(false)
        setSearch("")
        setSelectedIndex(0)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (filteredCommands[selectedIndex]) {
        executeCommand(filteredCommands[selectedIndex].id)
      }
    }
  }

  const executeCommand = (commandId: string) => {
    switch (commandId) {
      case "free":
        onLayoutChange("free")
        break
      case "centered":
        onLayoutChange("centered")
        break
      case "calendar":
        onCalendarToggle()
        break
      case "grid":
        onArrangeCards("grid")
        break
      case "circle":
        onArrangeCards("circle")
        break
      case "cascade":
        onArrangeCards("cascade")
        break
      case "restore":
        onRestoreAll()
        break
    }
    setOpen(false)
    setSearch("")
    setSelectedIndex(0)
  }

  if (!open) return null

  return (
    <div className="command-overlay" onClick={() => setOpen(false)}>
      <div className="command-container" onClick={(e) => e.stopPropagation()}>
        <div className="command-search-wrapper">
          <span className="command-search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="command-search-input"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {search && (
            <button className="command-clear-btn" onClick={() => setSearch("")}>
              ✕
            </button>
          )}
        </div>

        <div className="command-results">
          {Object.keys(groupedCommands).length > 0 ? (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="command-group">
                <div className="command-group-title">{category}</div>
                {cmds.map((cmd, _idx) => {
                  const globalIndex = filteredCommands.indexOf(cmd)
                  return (
                    <button
                      key={cmd.id}
                      className={`command-item ${globalIndex === selectedIndex ? "command-item-selected" : ""}`}
                      onClick={() => executeCommand(cmd.id)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      <span className="command-item-icon">{cmd.icon}</span>
                      <div className="command-item-content">
                        <div className="command-item-title">{cmd.title}</div>
                        <div className="command-item-description">{cmd.description}</div>
                      </div>
                      {cmd.shortcut && <kbd className="command-item-shortcut">{cmd.shortcut}</kbd>}
                    </button>
                  )
                })}
              </div>
            ))
          ) : (
            <div className="command-empty">
              <span className="command-empty-icon">🔍</span>
              <div className="command-empty-text">No commands found</div>
              <div className="command-empty-hint">Try searching for something else</div>
            </div>
          )}
        </div>

        <div className="command-footer">
          <div className="command-footer-item">
            <kbd>↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="command-footer-item">
            <kbd>↵</kbd>
            <span>Select</span>
          </div>
          <div className="command-footer-item">
            <kbd>esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
