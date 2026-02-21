"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Guestbook } from "./Guestbook"
import "../../styles/guestbook.css"

export function GuestbookContextMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node) && buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
      setIsOpen(false)
    }
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, handleClickOutside])

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="guestbook-toggle-button"
        aria-label="Toggle Guestbook"
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "1px solid #e0e0e0",
          background: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          zIndex: 9999,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)"
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)"
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"
        }}
      >
        💬
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div className="guestbook-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
            <motion.div
              ref={menuRef}
              className="guestbook-context-menu"
              style={{
                position: "fixed",
                bottom: 80,
                left: 20,
                zIndex: 10000,
              }}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Guestbook onClose={handleClose} isFloating />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
