"use client"

import { Bitcoin, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { formatBTC, formatCurrency, formatPercentage } from "@/lib/utils"
import type { PortfolioSummary } from "@/types/bitcoin"

interface PortfolioSummaryProps {
  summary: PortfolioSummary
}

export function PortfolioSummary({ summary }: PortfolioSummaryProps) {
  const isProfitable = summary.totalProfit >= 0

  if (summary.totalInvestment === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>포트폴리오 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">아직 투자 기록이 없습니다.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 투자금</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalInvestment)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">보유 BTC</CardTitle>
          <Bitcoin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBTC(summary.totalBTC)}</div>
          <p className="text-xs text-muted-foreground">평균 매수가: {formatCurrency(summary.averageBuyPrice)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">현재 평가액</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.currentValue)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">손익</CardTitle>
          {isProfitable ? <TrendingUp className="h-4 w-4 text-red-500" /> : <TrendingDown className="h-4 w-4 text-blue-500" />}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isProfitable ? "text-red-600" : "text-blue-600"}`}>{formatCurrency(summary.totalProfit)}</div>
          <p className={`text-xs ${isProfitable ? "text-red-600" : "text-blue-600"}`}>{formatPercentage(summary.totalProfitPercentage)}</p>
        </CardContent>
      </Card>
    </div>
  )
}
