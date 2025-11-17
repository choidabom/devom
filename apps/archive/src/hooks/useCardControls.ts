import { useCallback, useState } from "react"

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

export const useCardControls = (): [CardControlsState, CardActions] => {
  const [cardStates, setCardStates] = useState<CardControlsState>({})

  const handleClose = useCallback((index: number) => {
    setCardStates((prev) => ({
      ...prev,
      [index]: { ...prev[index], isClosed: true, isAnimating: true },
    }))

    // Remove animation state after animation completes
    setTimeout(() => {
      setCardStates((prev) => ({
        ...prev,
        [index]: { ...prev[index], isAnimating: false },
      }))
    }, 500)
  }, [])

  const handleMinimize = useCallback((index: number) => {
    setCardStates((prev) => ({
      ...prev,
      [index]: {
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

  return [cardStates, { handleClose, handleMinimize, handleMaximize, resetCard }]
}
