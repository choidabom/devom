"use client"

import { ChevronDown, ChevronUp, Edit, Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { calculateProfit, formatBTC, formatCurrency, formatPercentage } from "@/lib/utils"
import type { Investment } from "@/types/bitcoin"

type SortKey = "date" | "investmentAmount" | "buyPrice" | "btcAmount" | "currentValue" | "profit" | "profitPercentage"
type SortOrder = "asc" | "desc"

interface InvestmentListProps {
  investments: Investment[]
  currentPrice: number
  onRemoveInvestment: (id: string) => void
  onAddNewClick?: () => void
  onEditInvestment?: (investment: Investment) => void
}

export function InvestmentList({ investments, currentPrice, onRemoveInvestment, onAddNewClick, onEditInvestment }: InvestmentListProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("desc")
    }
  }

  const sortedInvestments = useMemo(() => {
    return [...investments].sort((a, b) => {
      let aValue: number
      let bValue: number

      switch (sortKey) {
        case "date":
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
          break
        case "investmentAmount":
          aValue = a.investmentAmount
          bValue = b.investmentAmount
          break
        case "buyPrice":
          aValue = a.buyPrice
          bValue = b.buyPrice
          break
        case "btcAmount":
          aValue = a.btcAmount
          bValue = b.btcAmount
          break
        case "currentValue":
          aValue = calculateProfit(a.investmentAmount, a.buyPrice, currentPrice).currentValue
          bValue = calculateProfit(b.investmentAmount, b.buyPrice, currentPrice).currentValue
          break
        case "profit":
          aValue = calculateProfit(a.investmentAmount, a.buyPrice, currentPrice).profit
          bValue = calculateProfit(b.investmentAmount, b.buyPrice, currentPrice).profit
          break
        case "profitPercentage":
          aValue = calculateProfit(a.investmentAmount, a.buyPrice, currentPrice).profitPercentage
          bValue = calculateProfit(b.investmentAmount, b.buyPrice, currentPrice).profitPercentage
          break
        default:
          return 0
      }

      if (sortOrder === "asc") {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })
  }, [investments, sortKey, sortOrder, currentPrice])

  const SortableHeader = ({ sortKey: key, children, className }: { sortKey: SortKey; children: React.ReactNode; className?: string }) => {
    const isActive = sortKey === key
    const SortIcon = sortOrder === "asc" ? ChevronUp : ChevronDown

    return (
      <TableHead className={className}>
        <Button
          variant="ghost"
          onClick={() => handleSort(key)}
          className={`h-auto p-0 font-medium flex items-center gap-1 hover:text-foreground ${isActive ? "text-foreground" : "text-muted-foreground"}`}
        >
          {children}
          {isActive && <SortIcon className="h-3 w-3" />}
        </Button>
      </TableHead>
    )
  }

  if (investments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>투자 기록</CardTitle>
            <Button onClick={onAddNewClick} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />새 투자 기록 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">아직 투자 기록이 없습니다.</p>
            <Button onClick={onAddNewClick} variant="outline">
              첫 투자 기록 추가하기
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>투자 기록 ({investments.length}건)</CardTitle>
          <Button onClick={onAddNewClick} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />새 투자 기록 추가
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader sortKey="date">날짜</SortableHeader>
                <SortableHeader sortKey="investmentAmount">투자금</SortableHeader>
                <SortableHeader sortKey="buyPrice">매수가</SortableHeader>
                <SortableHeader sortKey="btcAmount" className="hidden sm:table-cell">
                  BTC 수량
                </SortableHeader>
                <SortableHeader sortKey="currentValue">현재 가치</SortableHeader>
                <SortableHeader sortKey="profit">손익</SortableHeader>
                <SortableHeader sortKey="profitPercentage" className="hidden md:table-cell">
                  손익률
                </SortableHeader>
                <TableHead className="hidden lg:table-cell">메모</TableHead>
                <TableHead className="w-[100px]">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInvestments.map((investment) => {
                const profit = calculateProfit(investment.investmentAmount, investment.buyPrice, currentPrice)
                const isProfitable = profit.profit >= 0

                return (
                  <TableRow key={investment.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {new Date(investment.date)
                        .toLocaleDateString("ko-KR")
                        .replace(/\./g, ".")
                        .replace(/(\d{4})\.(\d{1,2})\.(\d{1,2})\.$/, (year, month, day) => {
                          const yy = year.slice(-2)
                          const mm = month.padStart(2, "0")
                          const dd = day.padStart(2, "0")
                          return `${yy}.${mm}.${dd}`
                        })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatCurrency(investment.investmentAmount)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatCurrency(investment.buyPrice)}</TableCell>
                    <TableCell className="hidden sm:table-cell whitespace-nowrap">{formatBTC(investment.btcAmount)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatCurrency(profit.currentValue)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className={`whitespace-nowrap ${isProfitable ? "text-red-600" : "text-blue-600"}`}>{formatCurrency(profit.profit)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={`whitespace-nowrap ${isProfitable ? "text-red-600" : "text-blue-600"}`}>{formatPercentage(profit.profitPercentage)}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[150px] truncate">
                      {investment.notes && (
                        <span className="text-sm text-muted-foreground" title={investment.notes}>
                          {investment.notes}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onEditInvestment?.(investment)} className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500 hover:text-blue-700">
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onRemoveInvestment(investment.id)} className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 hover:text-red-700">
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
