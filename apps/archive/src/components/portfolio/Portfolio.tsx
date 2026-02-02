"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import "@/styles/portfolio.css"
import { Tooltip } from "../common/Tooltip"
import { Dock } from "../common/Dock"
import { ContextMenu } from "../common/ContextMenu"
import { CommandPalette } from "../common/CommandPalette"
import { ProfileHeader } from "./ProfileHeader"
import { NowSection } from "./NowSection"
import { AlbumSection } from "./AlbumSection"
import { RecentLearningsSection } from "./RecentLearningsSection"
import { UsesSection } from "./UsesSection"
import { BookmarksSection } from "./BookmarksSection"
import { Footer } from "./Footer"
import { Calendar } from "./Calendar"
import { Cards } from "./Cards"

type LayoutMode = "free" | "centered"

export const Portfolio = () => {
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const [tooltipMessage, setTooltipMessage] = useState<string>("Work in Progress")
  // Always start with "free" layout on page load
  const [layout, setLayout] = useState<LayoutMode>("free")
  const [showCalendar, setShowCalendar] = useState<boolean>(true)
  const [minimizedCards, setMinimizedCards] = useState<Array<{ index: number; id: string; img_url?: string }>>([])
  const [restoreCardIndex, setRestoreCardIndex] = useState<number | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [arrangeMode, setArrangeMode] = useState<"grid" | "circle" | "cascade" | null>(null)

  const handleShowTooltip = (position: { x: number; y: number }, message?: string) => {
    setTooltipPosition(position)
    setTooltipMessage(message || "Work in Progress")
    setTooltipVisible(true)
  }

  const handleLayoutChange = (newLayout: LayoutMode) => {
    setLayout(newLayout)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    // Only show context menu if clicking on background (not on cards)
    if ((e.target as HTMLElement).closest(".card-container, .dock, .context-menu")) {
      return
    }
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const handleArrangeCards = (mode: "grid" | "circle" | "cascade") => {
    setArrangeMode(mode)
    // Reset after a moment to allow Cards component to react
    setTimeout(() => setArrangeMode(null), 100)
  }

  const handleRestoreAll = () => {
    // Restore all minimized cards
    minimizedCards.forEach((card) => {
      setRestoreCardIndex(card.index)
    })
  }

  useEffect(() => {
    if (tooltipVisible) {
      const timer = setTimeout(() => {
        setTooltipVisible(false)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [tooltipVisible])

  return (
    <motion.div className="portfolio-container" onContextMenu={handleContextMenu}>
      <Dock
        layout={layout}
        onLayoutChange={handleLayoutChange}
        showCalendar={showCalendar}
        onCalendarToggle={() => setShowCalendar(!showCalendar)}
        minimizedCards={minimizedCards}
        onCardRestore={(index) => setRestoreCardIndex(index)}
      />

      {layout === "free" ? (
        <>
          <Cards
            onShowTooltip={handleShowTooltip}
            onMinimizedCardsChange={setMinimizedCards}
            restoreCardIndex={restoreCardIndex}
            onRestoreComplete={() => setRestoreCardIndex(null)}
            arrangeMode={arrangeMode}
          />
          <AnimatePresence>
            {showCalendar && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <Calendar />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className="centered-layout-container">
          <div className="centered-layout-content">
            <ProfileHeader />

            <NowSection />

            <AlbumSection />

            <RecentLearningsSection />

            <UsesSection />

            <BookmarksSection />

            <Footer />
          </div>
        </div>
      )}

      <CommandPalette
        layout={layout}
        onLayoutChange={handleLayoutChange}
        showCalendar={showCalendar}
        onCalendarToggle={() => setShowCalendar(!showCalendar)}
        onArrangeCards={handleArrangeCards}
        onRestoreAll={handleRestoreAll}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          layout={layout}
          onLayoutChange={handleLayoutChange}
          showCalendar={showCalendar}
          onCalendarToggle={() => setShowCalendar(!showCalendar)}
          onArrangeCards={handleArrangeCards}
          onRestoreAll={handleRestoreAll}
        />
      )}

      <Tooltip message={tooltipMessage} isVisible={tooltipVisible} position={tooltipPosition || undefined} />
    </motion.div>
  )
}
