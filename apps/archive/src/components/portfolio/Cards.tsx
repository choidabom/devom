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
  onShowTooltip?: (position: { x: number; y: number }) => void
}

export const Cards = ({ onShowTooltip }: CardsProps) => {
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

        // hasControls가 있는 카드만 닫기/최소화/최대화 기능 사용
        if (item.hasControls) {
          if (cardState?.isClosed && !cardState?.isAnimating) return null
          if (cardState?.isMinimized) return null
        }

        if (!cardRects[index]) {
          initializeCardRect(index, item)
          return null
        }

        const cardRect = cardRects[index]
        const isMaximized = item.hasControls ? (cardState?.isMaximized ?? false) : false

        const cardWidth = isMaximized ? windowWidth : cardRect.w
        const cardHeight = isMaximized ? windowHeight : cardRect.h
        const cardX = isMaximized ? 0 : cardRect.x
        const cardY = isMaximized ? 0 : cardRect.y

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
            initial={{ x: cardX, y: cardY, width: cardWidth, height: cardHeight }}
            animate={{ x: cardX, y: cardY, width: cardWidth, height: cardHeight }}
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
