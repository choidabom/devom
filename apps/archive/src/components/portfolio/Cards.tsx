"use client"

import { useCallback, useContext, useEffect, useMemo, useState } from "react"

import { Card } from "@/components/portfolio/Card"
import { DetailCard } from "@/components/portfolio/DetailCard"
import { CardsContext } from "@/context/CardsContext"
import { portfolioWorks } from "@/data/portfolio"
import type { CardControlsState } from "@/hooks/useCardControls"
import { useCardPosition } from "@/hooks/useCardPosition"
import { useCardZIndex } from "@/hooks/useCardZIndex"
import { useWindowSize } from "@/hooks/useWindowsize"
import type { PortfolioWork } from "@/types/portfolio"

interface CardsProps {
  onShowTooltip?: (position: { x: number; y: number }, message?: string) => void
  onMinimizedCardsChange?: (minimizedCards: Array<{ index: number; id: string; img_url?: string }>) => void
  cardStates: CardControlsState
  onClose: (index: number) => void
  onMinimize: (index: number) => void
  onMaximize: (index: number) => void
}

export const Cards = ({ onShowTooltip, onMinimizedCardsChange, cardStates, onClose, onMinimize, onMaximize }: CardsProps) => {
  const [screen, setScreen] = useState<Window | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const { focusedCard } = useContext(CardsContext)
  const { width: windowWidth, height: windowHeight } = useWindowSize()

  const { getRandomPosition } = useCardPosition(portfolioWorks, screen)
  const { zIndices, bringToFront } = useCardZIndex(portfolioWorks.length)

  const [cardRects, setCardRects] = useState<Record<number, { x: number; y: number; w: number; h: number }>>({})

  useEffect(() => {
    setScreen(window)
    setLoading(false)
  }, [])

  // Notify parent about minimized cards
  useEffect(() => {
    const minimizedCards = portfolioWorks
      .map((item, index) => {
        const isMinimized = cardStates[index]?.isMinimized && item.hasControls
        return isMinimized ? { index, id: item.id, img_url: item.img_url } : null
      })
      .filter((card): card is NonNullable<typeof card> => card !== null)
    onMinimizedCardsChange?.(minimizedCards)
  }, [cardStates, onMinimizedCardsChange])

  const selectedCard = useMemo(() => portfolioWorks.find((item) => item.id === selectedCardId), [selectedCardId])

  const initializeCardRect = useCallback(
    (index: number, item: PortfolioWork) => {
      if (cardRects[index]) return

      const position = getRandomPosition(index)
      const x = parseFloat(position.x.replace("vw", "")) * (windowWidth / 100)
      const y = parseFloat(position.y.replace("vh", "")) * (windowHeight / 100)

      setCardRects((prev) => ({
        ...prev,
        [index]: {
          x,
          y,
          w: item.width,
          h: item.height,
        },
      }))
    },
    [cardRects, getRandomPosition, windowWidth, windowHeight]
  )

  const handleUpdateCardRect = useCallback((index: number, rect: { x: number; y: number; w: number; h: number }) => {
    setCardRects((prev) => ({
      ...prev,
      [index]: rect,
    }))
  }, [])

  const handleTitleClick = useCallback((id: string) => {
    setSelectedCardId(id)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedCardId(null)
  }, [])

  const maxZIndex = useMemo(() => Math.max(...Object.values(zIndices).filter((z) => typeof z === "number")), [zIndices])

  if (loading) return null

  return (
    <>
      {portfolioWorks.map((item, index) => {
        if (!screen) return null

        const cardState = cardStates[index]
        const zIndex = zIndices[index] ?? 100
        const cardInFocus = focusedCard !== null ? focusedCard === item.id : true
        const isTopmost = zIndex === maxZIndex

        // hasControls가 있는 카드만 닫기/최소화/최대화 기능 사용
        if (item.hasControls) {
          if (cardState?.isClosed && !cardState?.isAnimating) return null
        }

        if (!cardRects[index]) {
          initializeCardRect(index, item)
          return null
        }

        const cardRect = cardRects[index]

        return (
          <Card
            key={item.id}
            item={item}
            index={index}
            cardState={cardState}
            zIndex={zIndex}
            cardInFocus={cardInFocus}
            isTopmost={isTopmost}
            cardRect={cardRect}
            windowWidth={windowWidth}
            windowHeight={windowHeight}
            onClose={onClose}
            onMinimize={onMinimize}
            onMaximize={onMaximize}
            onShowTooltip={onShowTooltip}
            onTitleClick={handleTitleClick}
            onBringToFront={bringToFront}
            onUpdateCardRect={handleUpdateCardRect}
          />
        )
      })}

      {selectedCard && selectedCard.description && (
        <DetailCard
          title={selectedCard.id}
          year={selectedCard.year}
          category={selectedCard.category}
          description={selectedCard.description}
          url={selectedCard.url}
          onClose={handleCloseDetail}
        />
      )}
    </>
  )
}
