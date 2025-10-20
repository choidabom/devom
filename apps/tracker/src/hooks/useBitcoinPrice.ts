"use client"

import { useEffect, useState } from "react"
import type { BitcoinPrice } from "@/types/bitcoin"

export function useBitcoinPrice() {
  const [price, setPrice] = useState<BitcoinPrice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrice = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/price")

      if (!response.ok) {
        throw new Error("Failed to fetch price")
      }

      const data = await response.json()
      setPrice(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPrice()

    // 30초마다 자동 갱신
    const interval = setInterval(fetchPrice, 30000)

    return () => clearInterval(interval)
  }, [])

  return { price, isLoading, error, refetch: fetchPrice }
}
