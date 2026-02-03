import { useCallback, useEffect, useRef, useState } from "react"
import { ANIMATION_DURATION } from "@/constants/animation"

export interface CardState {
  isClosed: boolean
  isMinimized: boolean
  isMaximized: boolean
  isAnimating: boolean
}

export interface CardActions {
  handleClose: (index: number) => void
  handleMinimize: (index: number) => void
  handleMaximize: (index: number) => void
  resetCard: (index: number) => void
}

export type CardControlsState = Record<number, CardState>

const DEFAULT_CARD_STATE: CardState = {
  isClosed: false,
  isMinimized: false,
  isMaximized: false,
  isAnimating: false,
}

export const useCardControls = (): [CardControlsState, CardActions] => {
  const [cardStates, setCardStates] = useState<CardControlsState>({})
  const timersRef = useRef<Map<number, NodeJS.Timeout>>(new Map())

  const handleClose = useCallback((index: number) => {
    // Clear existing timer
    const existingTimer = timersRef.current.get(index)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    setCardStates((prev) => ({
      ...prev,
      [index]: { ...DEFAULT_CARD_STATE, ...prev[index], isClosed: true, isAnimating: true },
    }))

    // Remove animation state after animation completes
    const timer = setTimeout(() => {
      setCardStates((prev) => ({
        ...prev,
        [index]: { ...DEFAULT_CARD_STATE, ...prev[index], isAnimating: false },
      }))
      timersRef.current.delete(index)
    }, ANIMATION_DURATION.CLOSE)

    timersRef.current.set(index, timer)
  }, [])

  const handleMinimize = useCallback((index: number) => {
    setCardStates((prev) => ({
      ...prev,
      [index]: {
        ...DEFAULT_CARD_STATE,
        ...prev[index],
        isMinimized: !prev[index]?.isMinimized,
        isMaximized: false,
      },
    }))
  }, [])

  const handleMaximize = useCallback((index: number) => {
    setCardStates((prev) => ({
      ...prev,
      [index]: {
        ...DEFAULT_CARD_STATE,
        ...prev[index],
        isMaximized: !prev[index]?.isMaximized,
        isMinimized: false,
      },
    }))
  }, [])

  const resetCard = useCallback((index: number) => {
    setCardStates((prev) => {
      const newState = { ...prev }
      delete newState[index]
      return newState
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer))
      timersRef.current.clear()
    }
  }, [])

  return [cardStates, { handleClose, handleMinimize, handleMaximize, resetCard }]
}
