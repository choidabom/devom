import { useCallback, useEffect, useState } from "react"

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
      const currentMax = newZIndices[-1] ?? 100
      const newMax = currentMax + 1
      newZIndices[-1] = newMax
      newZIndices[index] = newMax
      return newZIndices
    })
  }, [])

  return { zIndices, bringToFront }
}
