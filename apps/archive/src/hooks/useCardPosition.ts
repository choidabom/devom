import { useCallback, useRef, useState } from "react"

import { CardPosition, PortfolioWork } from "@/types/portfolio"

/**
 * Better seeded random number generator using multiplicative hash
 * This ensures better distribution across all indices
 */
const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const useCardPosition = (works: PortfolioWork[], screen: Window | undefined) => {
  const [seed] = useState(() => Math.floor(Math.random() * 1000000))
  const positionsRef = useRef<{ [key: number]: CardPosition }>({})
  const worksLengthRef = useRef(works.length)

  // Reset positions if works array length changes
  if (worksLengthRef.current !== works.length) {
    positionsRef.current = {}
    worksLengthRef.current = works.length
  }

  const seededRandom = useCallback(
    (index: number, offset: number) => {
      // Create unique seed for each index and offset combination
      // Use card ID hash instead of just index for better distribution
      const uniqueSeed = seed + index * 12345 + offset * 67890
      const rng = mulberry32(uniqueSeed)
      return rng()
    },
    [seed]
  )

  const getRandomPosition = useCallback(
    (index: number): CardPosition => {
      const work = works[index]
      if (!positionsRef.current[index] && screen !== undefined && work) {
        const randomX = seededRandom(index, 0) * (100 - (work.width / screen.innerWidth) * 100)
        const randomY = seededRandom(index, 1) * (100 - (work.height / (screen.innerHeight - 200)) * 100)
        positionsRef.current[index] = { x: `${randomX}vw`, y: `${randomY}vh` }
      }
      return positionsRef.current[index] || { x: "0vw", y: "0vh" }
    },
    [works, screen, seededRandom]
  )

  return { getRandomPosition }
}
