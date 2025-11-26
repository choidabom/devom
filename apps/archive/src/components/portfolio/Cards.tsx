"use client"

import { motion } from "framer-motion"
import { useContext, useEffect, useState } from "react"
import { CardsContext } from "@/context/CardsContext"
import { portfolioWorks } from "@/data/portfolio"
import { useCardControls } from "@/hooks/useCardControls"
import { useCardPosition } from "@/hooks/useCardPosition"
import { useCardZIndex } from "@/hooks/useCardZIndex"
import { CardContent } from "@/components/portfolio/CardContent"
import { CardHeader } from "@/components/portfolio/CardHeader"
import { DetailCard } from "@/components/portfolio/DetailCard"

interface CardsProps {
  onShowTooltip?: (position: { x: number; y: number }) => void
}

export const Cards = ({ onShowTooltip }: CardsProps) => {
  const [screen, setScreen] = useState<Window | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const { focusedCard } = useContext(CardsContext)

  const { getRandomPosition } = useCardPosition(portfolioWorks, screen)
  const { zIndices, bringToFront } = useCardZIndex(portfolioWorks.length)
  const [cardStates, { handleClose, handleMinimize, handleMaximize }] = useCardControls()

  useEffect(() => {
    setScreen(window)
    setLoading(false)
  }, [])

  const selectedCard = portfolioWorks.find((item) => item.id === selectedCardId)

  if (loading) return null

  return (
    <>
      {portfolioWorks.map((item, index) => {
        if (!screen) return null

        const cardState = cardStates[index]
        if (cardState?.isClosed && !cardState?.isAnimating) return null

        const { x, y } = getRandomPosition(index)
        const zIndex = zIndices[index]
        const cardInFocus = focusedCard !== null ? focusedCard === item.id : true

        return (
          <motion.div
            key={item.id}
            className="card-container"
            drag
            dragMomentum={false}
            style={{ zIndex }}
            onMouseDown={() => bringToFront(index)}
            onTouchStart={() => bringToFront(index)}
            whileHover={{ translateY: -4 }}
          >
            <div
              className={`card-${index} card`}
              style={{
                left: x,
                top: y,
                filter: cardInFocus ? "unset" : "blur(12px)",
                opacity: cardInFocus ? 1 : 0,
              }}
            >
              <CardHeader
                item={item}
                index={index}
                onClose={handleClose}
                onMinimize={handleMinimize}
                onMaximize={handleMaximize}
                onTitleClick={() => {
                  setSelectedCardId(item.id)
                }}
                onShowTooltip={onShowTooltip}
              />
              <CardContent item={item} />
            </div>
          </motion.div>
        )
      })}

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
    </>
  )
}
