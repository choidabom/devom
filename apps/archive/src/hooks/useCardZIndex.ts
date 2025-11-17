import { useState, useEffect, useCallback } from "react"

export const useCardZIndex = (totalCards: number) => {
  const [zIndices, setZIndices] = useState<{ [key: number]: number }>({})

  useEffect(() => {
    const initialZIndices: { [key: number]: number } = {}

    for (let i = 0; i < totalCards; i++) {
      initialZIndices[i] = i + 100
    }

    // Max zIndex
    initialZIndices[-1] = 100 + totalCards + 20

    setZIndices(initialZIndices)
  }, [totalCards])

  const bringToFront = useCallback((index: number) => {
    setZIndices((prev) => {
      const newZIndices = { ...prev }
      newZIndices[-1] += 1
      newZIndices[index] = newZIndices[-1]
      return newZIndices
    })
  }, [])

  return { zIndices, bringToFront }
}
