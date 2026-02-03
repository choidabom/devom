import type { ReactNode } from "react"
import { motion } from "framer-motion"

interface DetailCardProps {
  title: string
  year: string
  category: string
  description: string | ReactNode
  url: string
  onClose: () => void
}

export const DetailCard = ({ title, year, category, description, url, onClose }: DetailCardProps) => {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="detail-card-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          zIndex: 9999,
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Detail Card */}
      <motion.div
        className="detail-card"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky note top tape effect */}
        <div className="detail-card-sticky-top" />

        <div className="detail-card-header-bar">
          <div className="detail-card-title-section">
            <h2 className="detail-card-title">{title}</h2>
            <div className="detail-card-meta">
              <span>{year}</span>
              <span className="detail-card-separator">•</span>
              <span>{category}</span>
            </div>
          </div>
          <button className="detail-card-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="detail-card-body">{description}</div>

        {url && (
          <div className="detail-card-footer">
            <a href={url} target="_blank" rel="noopener noreferrer" className="detail-card-link">
              Visit Project →
            </a>
          </div>
        )}
      </motion.div>
    </>
  )
}
