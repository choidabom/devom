"use client"

import { AnimatePresence, motion } from "framer-motion"
import { memo, useState } from "react"
import { portfolioWorks } from "@/data/portfolio"
import { DetailCard } from "@/components/portfolio/DetailCard"

export const Gallery = memo(() => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  const selectedCard = portfolioWorks.find((item) => item.id === selectedCardId)

  return (
    <>
      <div className="gallery-grid">
        {portfolioWorks.map((item, index) => (
          <motion.div
            key={item.id}
            className="gallery-item"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            onClick={() => item.description && setSelectedCardId(item.id)}
            style={{ cursor: item.description ? "pointer" : "default" }}
          >
            {item.contentType === "image" && item.img_url && <img src={item.img_url} alt={item.id} className="gallery-image" loading="lazy" />}
            {item.contentType === "iframe" && item.iframe_url && (
              <div className="gallery-iframe-wrapper">
                <iframe src={item.iframe_url} title={item.id} className="gallery-iframe" sandbox="allow-same-origin allow-scripts allow-forms allow-popups" loading="lazy" />
              </div>
            )}
            {item.contentType === "component" && item.component && (
              <div className="gallery-component-wrapper">
                <item.component />
              </div>
            )}
            <div className="gallery-item-info">
              <h3 className="gallery-item-title">{item.id}</h3>
              <span className="gallery-item-year">{item.year}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedCard && selectedCard.description && (
          <DetailCard
            id={selectedCard.id}
            title={selectedCard.id}
            year={selectedCard.year}
            category={selectedCard.category}
            description={selectedCard.description}
            url={selectedCard.url}
            onClose={() => setSelectedCardId(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
})

Gallery.displayName = "Gallery"
