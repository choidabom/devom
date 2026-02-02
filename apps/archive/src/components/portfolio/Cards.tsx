"use client"

import { CardContent } from "@/components/portfolio/CardContent"
import { CardHeader } from "@/components/portfolio/CardHeader"
import { DetailCard } from "@/components/portfolio/DetailCard"
import { CardsContext } from "@/context/CardsContext"
import { portfolioWorks } from "@/data/portfolio"
import { useCardControls } from "@/hooks/useCardControls"
import { useCardPosition } from "@/hooks/useCardPosition"
import { useCardZIndex } from "@/hooks/useCardZIndex"
import { useWindowSize } from "@/hooks/useWindowsize"
import type { PortfolioWork } from "@/types/portfolio"
import { motion } from "framer-motion"
import { useContext, useEffect, useState } from "react"

interface CardsProps {
  onShowTooltip?: (position: { x: number; y: number }, message?: string) => void
  onMinimizedCardsChange?: (minimizedCards: Array<{ index: number; id: string; img_url?: string }>) => void
  restoreCardIndex?: number | null
  onRestoreComplete?: () => void
  arrangeMode?: "grid" | "circle" | "cascade" | null
}

export const Cards = ({ onShowTooltip, onMinimizedCardsChange, restoreCardIndex, onRestoreComplete, arrangeMode }: CardsProps) => {
  const [screen, setScreen] = useState<Window | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const { focusedCard } = useContext(CardsContext)
  const { width: windowWidth, height: windowHeight } = useWindowSize()

  const { getRandomPosition } = useCardPosition(portfolioWorks, screen)
  const { zIndices, bringToFront } = useCardZIndex(portfolioWorks.length)
  const [cardStates, { handleClose, handleMinimize, handleMaximize }] = useCardControls()

  const [cardRects, setCardRects] = useState<Record<number, { x: number; y: number; w: number; h: number }>>({})

  useEffect(() => {
    setScreen(window)
    setLoading(false)
  }, [])

  // Notify parent about minimized cards
  useEffect(() => {
    const minimizedCards = portfolioWorks
      .map((item, index) => ({ item, index }))
      .filter(({ index }) => cardStates[index]?.isMinimized && portfolioWorks[index]?.hasControls)
      .map(({ item, index }) => ({
        index,
        id: item.id,
        img_url: item.img_url,
      }))
    onMinimizedCardsChange?.(minimizedCards)
  }, [cardStates, onMinimizedCardsChange])

  // Restore card when requested
  useEffect(() => {
    if (restoreCardIndex !== null && restoreCardIndex !== undefined) {
      handleMinimize(restoreCardIndex)
      bringToFront(restoreCardIndex)
      onRestoreComplete?.()
    }
  }, [restoreCardIndex, handleMinimize, bringToFront, onRestoreComplete])

  // Arrange cards when requested
  useEffect(() => {
    if (!arrangeMode || !windowWidth || !windowHeight) return

    const visibleCards = portfolioWorks.filter((_, index) => !cardStates[index]?.isClosed && !cardStates[index]?.isMinimized)

    const newRects: Record<number, { x: number; y: number; w: number; h: number }> = {}

    visibleCards.forEach((item, visibleIndex) => {
      const index = portfolioWorks.indexOf(item)
      const currentRect = cardRects[index]
      if (!currentRect) return

      let x = 0
      let y = 0

      switch (arrangeMode) {
        case "grid": {
          const cols = Math.ceil(Math.sqrt(visibleCards.length))
          const row = Math.floor(visibleIndex / cols)
          const col = visibleIndex % cols
          const padding = 40
          x = padding + col * (currentRect.w + padding)
          y = padding + row * (currentRect.h + padding)
          break
        }
        case "circle": {
          const centerX = windowWidth / 2
          const centerY = windowHeight / 2
          const radius = Math.min(windowWidth, windowHeight) * 0.35
          const angle = (visibleIndex / visibleCards.length) * 2 * Math.PI
          x = centerX + radius * Math.cos(angle) - currentRect.w / 2
          y = centerY + radius * Math.sin(angle) - currentRect.h / 2
          break
        }
        case "cascade": {
          const offset = 40
          x = 50 + visibleIndex * offset
          y = 50 + visibleIndex * offset
          break
        }
      }

      newRects[index] = {
        x: Math.max(0, Math.min(x, windowWidth - currentRect.w)),
        y: Math.max(0, Math.min(y, windowHeight - currentRect.h)),
        w: currentRect.w,
        h: currentRect.h,
      }
    })

    setCardRects((prev) => ({ ...prev, ...newRects }))
  }, [arrangeMode, windowWidth, windowHeight, cardStates])

  const selectedCard = portfolioWorks.find((item) => item.id === selectedCardId)

  const initializeCardRect = (index: number, item: PortfolioWork) => {
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
  }

  if (loading) return null

  return (
    <>
      {portfolioWorks.map((item, index) => {
        if (!screen) return null

        const cardState = cardStates[index]
        const zIndex = zIndices[index]
        const cardInFocus = focusedCard !== null ? focusedCard === item.id : true
        const maxZIndex = Math.max(...Object.values(zIndices).filter((z) => typeof z === "number"))
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
        const isMaximized = item.hasControls ? (cardState?.isMaximized ?? false) : false
        const isMinimized = item.hasControls ? (cardState?.isMinimized ?? false) : false

        // Calculate dock position (center bottom)
        const dockX = windowWidth / 2 - 20
        const dockY = windowHeight - 80

        const cardWidth = isMaximized ? windowWidth : isMinimized ? 40 : cardRect.w
        const cardHeight = isMaximized ? windowHeight : isMinimized ? 40 : cardRect.h
        const cardX = isMaximized ? 0 : isMinimized ? dockX : cardRect.x
        const cardY = isMaximized ? 0 : isMinimized ? dockY : cardRect.y

        const updateCardRect = (newRect: { x: number; y: number; w: number; h: number }) => {
          setCardRects((prev) => ({
            ...prev,
            [index]: newRect,
          }))
        }

        return (
          <motion.div
            key={item.id}
            className="card-container"
            // hasControls 카드: 헤더를 잡고 움직이는 WindowControls 방식
            // hasControls 없는 카드: 전체 카드를 framer-motion으로 드래그
            drag={!isMaximized}
            dragMomentum={false}
            dragConstraints={{
              left: 0,
              top: 0,
              right: windowWidth - cardRect.w,
              bottom: windowHeight - cardRect.h,
            }}
            dragPropagation={false}
            dragElastic={0}
            initial={{ x: cardX, y: cardY, width: cardWidth, height: cardHeight, opacity: 1, scale: 1 }}
            animate={{
              x: cardX,
              y: cardY,
              width: cardWidth,
              height: cardHeight,
              opacity: isMinimized ? 0 : 1,
              scale: isMinimized ? 0.1 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              opacity: { duration: 0.2 },
            }}
            style={{
              zIndex,
              position: "fixed",
            }}
            onMouseDown={() => bringToFront(index)}
            onTouchStart={() => bringToFront(index)}
            onDragStart={() => {
              // 드래그 시작 시 iframe의 pointer-events를 차단
              const cardElement = document.querySelector(`.card-${index}`)
              if (cardElement) {
                const iframe = cardElement.querySelector("iframe")
                if (iframe) {
                  iframe.style.pointerEvents = "none"
                }
              }
            }}
            onDragEnd={(_, info) => {
              // 드래그 종료 시 iframe의 pointer-events 복원
              const cardElement = document.querySelector(`.card-${index}`)
              if (cardElement) {
                const iframe = cardElement.querySelector("iframe")
                if (iframe) {
                  iframe.style.pointerEvents = "auto"
                }
              }

              if (!isMaximized && cardRect) {
                const currentRect = cardRects[index]
                if (!currentRect) return
                const newX = Math.max(0, Math.min(currentRect.x + info.offset.x, windowWidth - currentRect.w))
                const newY = Math.max(0, Math.min(currentRect.y + info.offset.y, windowHeight - currentRect.h))
                updateCardRect({
                  x: newX,
                  y: newY,
                  w: currentRect.w,
                  h: currentRect.h,
                })
              }
            }}
            whileHover={!isMaximized ? { translateY: -4 } : undefined}
          >
            <div
              className={`card-${index} card`}
              style={{
                width: "100%",
                height: "100%",
                filter: cardInFocus ? "unset" : "blur(12px)",
                opacity: cardInFocus ? 1 : 0,
              }}
            >
              <CardHeader
                item={item}
                index={index}
                onClose={item.hasControls ? handleClose : undefined}
                onMinimize={item.hasControls ? handleMinimize : undefined}
                onMaximize={item.hasControls ? handleMaximize : undefined}
                onTitleClick={() => {
                  setSelectedCardId(item.id)
                }}
                onShowTooltip={onShowTooltip}
                isMaximized={isMaximized}
                onDoubleClick={item.hasControls ? () => handleMaximize(index) : undefined}
              />
              <CardContent item={item} isTopmost={isTopmost} onBringToFront={() => bringToFront(index)} />
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
