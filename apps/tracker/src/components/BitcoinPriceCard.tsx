"use client"

import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { formatCurrency } from "@/lib/utils"
import type { BitcoinPrice } from "@/types/bitcoin"

interface BitcoinPriceCardProps {
  price: BitcoinPrice | null
  isLoading: boolean
  onRefresh: () => void
}

export function BitcoinPriceCard({ price, isLoading, onRefresh }: BitcoinPriceCardProps) {
  const formatLastUpdate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">₿ 비트코인 현재가</CardTitle>
        <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isLoading} className="h-8 w-8">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {price ? (
            <>
              <div className="flex items-center space-x-2">
                {price.change === "RISE" ? <TrendingUp className="h-5 w-5 text-red-500" /> : <TrendingDown className="h-5 w-5 text-blue-500" />}
                <span className="text-2xl font-bold">{formatCurrency(price.price)}</span>
              </div>

              {/* 변화율과 변화가격 */}
              {price.changeRate && price.changePrice && (
                <div className={`flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0 ${price.change === "RISE" ? "text-red-500" : "text-blue-500"}`}>
                  <span className="text-sm font-medium">
                    {price.change === "RISE" ? "+" : "-"}
                    {formatCurrency(Math.abs(price.changePrice))}
                  </span>
                  <span className="text-sm">
                    ({price.change === "RISE" ? "+" : "-"}
                    {(Math.abs(price.changeRate) * 100).toFixed(2)}%)
                  </span>
                </div>
              )}

              {/* 고가/저가 */}
              {price.high && price.low && (
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2 text-xs text-muted-foreground">
                  <div>
                    고가: <span className="font-medium">{formatCurrency(price.high)}</span>
                  </div>
                  <div>
                    저가: <span className="font-medium">{formatCurrency(price.low)}</span>
                  </div>
                </div>
              )}

              {/* 거래량 */}
              {price.volume && (
                <div className="text-xs text-muted-foreground">
                  24시간 거래량: <span className="font-medium">{price.volume.toFixed(2)} BTC</span>
                </div>
              )}

              <p className="text-xs text-muted-foreground">마지막 업데이트: {formatLastUpdate(price.timestamp)} (업비트)</p>
            </>
          ) : (
            <div className="space-y-2">
              <div className="h-8 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
