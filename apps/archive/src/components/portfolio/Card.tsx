"use client"

import { memo, useCallback, useMemo, useRef } from "react"
import { motion } from "framer-motion"

import { CardContent } from "@/components/portfolio/CardContent"
import { CardHeader } from "@/components/portfolio/CardHeader"
import { LAYOUT_CONSTANTS } from "@/constants/layout"
import type { PortfolioWork } from "@/types/portfolio"
import type { CardState } from "@/hooks/useCardControls"

interface CardProps {
  item: PortfolioWork
  index: number
  cardState?: CardState
  zIndex: number
  cardInFocus: boolean
  isTopmost: boolean
  cardRect: { x: number; y: number; w: number; h: number }
  windowWidth: number
  windowHeight: number
  onClose?: (index: number) => void
  onMinimize?: (index: number) => void
  onMaximize?: (index: number) => void
  onShowTooltip?: (position: { x: number; y: number }, message?: string) => void
  onTitleClick: (id: string) => void
  onBringToFront: (index: number) => void
  onUpdateCardRect: (index: number, rect: { x: number; y: number; w: number; h: number }) => void
}

export const Card = memo(function Card({
  item,
  index,
  cardState,
  zIndex,
  cardInFocus,
  isTopmost,
  cardRect,
  windowWidth,
  windowHeight,
  onClose,
  onMinimize,
  onMaximize,
  onShowTooltip,
  onTitleClick,
  onBringToFront,
  onUpdateCardRect,
}: CardProps) {
  const isMaximized = item.hasControls ? (cardState?.isMaximized ?? false) : false
  const isMinimized = item.hasControls ? (cardState?.isMinimized ?? false) : false
  const cardRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  // Calculate dock position (center bottom)
  const dockX = windowWidth / 2 - LAYOUT_CONSTANTS.DOCK_OFFSET_X
  const dockY = windowHeight - LAYOUT_CONSTANTS.DOCK_OFFSET_Y

  const cardWidth = isMaximized ? windowWidth : isMinimized ? LAYOUT_CONSTANTS.MINIMIZED_CARD_SIZE : cardRect.w
  const cardHeight = isMaximized ? windowHeight : isMinimized ? LAYOUT_CONSTANTS.MINIMIZED_CARD_SIZE : cardRect.h
  const cardX = isMaximized ? 0 : isMinimized ? dockX : cardRect.x
  const cardY = isMaximized ? 0 : isMinimized ? dockY : cardRect.y

  const handleMouseDown = useCallback(() => {
    onBringToFront(index)
  }, [index, onBringToFront])

  const handleTitleClick = useCallback(() => {
    onTitleClick(item.id)
  }, [item.id, onTitleClick])

  const handleMaximize = useCallback(() => {
    onMaximize?.(index)
  }, [index, onMaximize])

  const handleBringToFront = useCallback(() => {
    onBringToFront(index)
  }, [index, onBringToFront])

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true
    if (cardRef.current) {
      const iframe = cardRef.current.querySelector("iframe")
      if (iframe) {
        iframe.style.pointerEvents = "none"
      }
    }
  }, [])

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number; y: number } }) => {
      isDraggingRef.current = false
      if (cardRef.current) {
        const iframe = cardRef.current.querySelector("iframe")
        if (iframe) {
          iframe.style.pointerEvents = "auto"
        }
      }

      if (!isMaximized && cardRect) {
        const newX = cardRect.x + info.offset.x
        const newY = cardRect.y + info.offset.y
        onUpdateCardRect(index, {
          x: newX,
          y: newY,
          w: cardRect.w,
          h: cardRect.h,
        })
      }
    },
    [isMaximized, cardRect, index, onUpdateCardRect]
  )

  const animateProps = useMemo(
    () => ({
      x: cardX,
      y: cardY,
      width: cardWidth,
      height: cardHeight,
      opacity: isMinimized ? 0 : 1,
      scale: isMinimized ? 0.1 : 1,
    }),
    [cardX, cardY, cardWidth, cardHeight, isMinimized]
  )

  const transitionProps = useMemo(
    () => ({
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      opacity: { duration: 0.2 },
    }),
    []
  )

  const dragTransition = useMemo(
    () => ({
      power: 0,
      timeConstant: 0,
    }),
    []
  )

  const cardStyle = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      opacity: cardInFocus ? 1 : 0,
    }),
    [cardInFocus]
  )

  return (
    <motion.div
      key={item.id}
      className="card-container"
      drag={!isMaximized}
      dragMomentum={false}
      dragPropagation={false}
      dragElastic={0}
      dragTransition={dragTransition}
      initial={{ x: cardX, y: cardY, width: cardWidth, height: cardHeight, opacity: 1, scale: 1 }}
      animate={animateProps}
      transition={transitionProps}
      style={{
        zIndex,
        position: "fixed",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div ref={cardRef} className={`card-${index} card`} style={cardStyle}>
        <CardHeader
          item={item}
          index={index}
          onClose={item.hasControls ? onClose : undefined}
          onMinimize={item.hasControls ? onMinimize : undefined}
          onMaximize={item.hasControls ? onMaximize : undefined}
          onTitleClick={handleTitleClick}
          onShowTooltip={onShowTooltip}
          isMaximized={isMaximized}
          onDoubleClick={item.hasControls ? handleMaximize : undefined}
        />
        <CardContent item={item} isTopmost={isTopmost} onBringToFront={handleBringToFront} />
      </div>
    </motion.div>
  )
})
