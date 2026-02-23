"use client"

import { useCallback, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { ContextMenu } from "@/components/common/ContextMenu"
import { Dock } from "@/components/common/Dock"
import { Tooltip } from "@/components/common/Tooltip"
import { Guestbook } from "@/components/guestbook/Guestbook"
import { Cards } from "@/components/portfolio/Cards"
import { useCardControls } from "@/hooks/useCardControls"
import { usePortfolioState } from "@/hooks/usePortfolioState"
import "@/styles/portfolio.css"

export const Portfolio = () => {
  const [state, actions] = usePortfolioState()
  const { tooltipVisible, tooltipPosition, tooltipMessage, minimizedCards, contextMenu } = state
  const { handleShowTooltip, handleContextMenu, setMinimizedCards, setContextMenu } = actions
  const [cardStates, { handleClose, handleMinimize, handleMaximize }] = useCardControls()
  const [showGuestbook, setShowGuestbook] = useState(false)

  const handleGuestbookToggle = useCallback(() => {
    setShowGuestbook(!showGuestbook)
  }, [showGuestbook])

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null)
  }, [setContextMenu])

  return (
    <motion.div className="portfolio-container" onContextMenu={handleContextMenu}>
      <Dock minimizedCards={minimizedCards} onCardRestore={handleMinimize} showGuestbook={showGuestbook} onGuestbookToggle={handleGuestbookToggle} />

      <Cards
        onShowTooltip={handleShowTooltip}
        onMinimizedCardsChange={setMinimizedCards}
        cardStates={cardStates}
        onClose={handleClose}
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
      />

      <AnimatePresence>
        {showGuestbook && (
          <>
            <motion.div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.3)",
                zIndex: 9999,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleGuestbookToggle}
            />
            <motion.div
              drag
              dragMomentum={false}
              dragElastic={0}
              style={{
                position: "fixed",
                left: "50%",
                top: "50%",
                x: "-50%",
                y: "-50%",
                width: "500px",
                height: "700px",
                maxWidth: "90vw",
                maxHeight: "90vh",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                zIndex: 10000,
              }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Guestbook onClose={handleGuestbookToggle} isFloating />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={handleContextMenuClose} />}

      <Tooltip message={tooltipMessage} isVisible={tooltipVisible} position={tooltipPosition || undefined} />
    </motion.div>
  )
}
