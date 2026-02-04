"use client"

import { useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { ContextMenu } from "@/components/common/ContextMenu"
import { Dock } from "@/components/common/Dock"
import { Tooltip } from "@/components/common/Tooltip"
import { Calendar } from "@/components/portfolio/Calendar"
import { Cards } from "@/components/portfolio/Cards"
import { useCardControls } from "@/hooks/useCardControls"
import { usePortfolioState } from "@/hooks/usePortfolioState"
import "@/styles/portfolio.css"

export const Portfolio = () => {
  const [state, actions] = usePortfolioState()
  const { tooltipVisible, tooltipPosition, tooltipMessage, showCalendar, minimizedCards, contextMenu } = state
  const { handleShowTooltip, handleContextMenu, setMinimizedCards, setContextMenu, setShowCalendar } = actions
  const [cardStates, { handleClose, handleMinimize, handleMaximize }] = useCardControls()

  const handleCalendarToggle = useCallback(() => {
    setShowCalendar(!showCalendar)
  }, [showCalendar, setShowCalendar])

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null)
  }, [setContextMenu])

  return (
    <motion.div className="portfolio-container" onContextMenu={handleContextMenu}>
      <Dock showCalendar={showCalendar} onCalendarToggle={handleCalendarToggle} minimizedCards={minimizedCards} onCardRestore={handleMinimize} />

      <Cards
        onShowTooltip={handleShowTooltip}
        onMinimizedCardsChange={setMinimizedCards}
        cardStates={cardStates}
        onClose={handleClose}
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
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

      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={handleContextMenuClose} showCalendar={showCalendar} onCalendarToggle={handleCalendarToggle} />}

      <Tooltip message={tooltipMessage} isVisible={tooltipVisible} position={tooltipPosition || undefined} />
    </motion.div>
  )
}
