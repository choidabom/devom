"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { formatBTC } from "@/lib/utils"
import type { Investment } from "@/types/bitcoin"

function getCurrentDateString(): string {
  const isoString = new Date().toISOString()
  const datePart = isoString.split("T")[0]
  return datePart || isoString.substring(0, 10)
}

interface InvestmentFormProps {
  onAddInvestment?: (investment: Omit<Investment, "id" | "btcAmount">) => void
  onUpdateInvestment?: (id: string, investment: Omit<Investment, "id" | "btcAmount">) => void
  currentPrice?: number
  editingInvestment?: Investment | null
  mode?: "add" | "edit"
}

export function InvestmentForm({ onAddInvestment, onUpdateInvestment, currentPrice, editingInvestment, mode = "add" }: InvestmentFormProps) {
  const [investmentAmount, setInvestmentAmount] = useState("")
  const [buyPrice, setBuyPrice] = useState("")
  const [date, setDate] = useState(() => getCurrentDateString())
  const [notes, setNotes] = useState("")

  // 수정 모드일 때 기존 데이터로 폼 초기화
  useEffect(() => {
    if (mode === "edit" && editingInvestment) {
      setInvestmentAmount(editingInvestment.investmentAmount.toString())
      setBuyPrice(editingInvestment.buyPrice.toString())
      // editingInvestment.date는 Investment 타입에서 string으로 정의됨
      if (typeof editingInvestment.date === "string") {
        setDate(editingInvestment.date)
      } else {
        setDate(getCurrentDateString())
      }
      setNotes(editingInvestment.notes || "")
    } else if (mode === "add") {
      // 추가 모드일 때 폼 초기화
      setInvestmentAmount("")
      setBuyPrice("")
      setDate(getCurrentDateString())
      setNotes("")
    }
  }, [mode, editingInvestment])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const amount = parseFloat(investmentAmount)
    const price = parseFloat(buyPrice)

    if (amount > 0 && price > 0) {
      const investmentData = {
        date,
        investmentAmount: amount,
        buyPrice: price,
        notes: notes.trim() || undefined,
      }

      if (mode === "edit" && editingInvestment && onUpdateInvestment) {
        onUpdateInvestment(editingInvestment.id, investmentData)
      } else if (mode === "add" && onAddInvestment) {
        onAddInvestment(investmentData)
      }

      // 추가 모드일 때만 폼 초기화
      if (mode === "add") {
        setInvestmentAmount("")
        setBuyPrice("")
        setNotes("")
      }
    }
  }

  const calculateBTCAmount = () => {
    const amount = parseFloat(investmentAmount)
    const price = parseFloat(buyPrice)
    if (amount > 0 && price > 0) {
      return amount / price
    }
    return 0
  }

  const isAddMode = mode === "add"
  const buttonText = isAddMode ? "투자 기록 추가" : "투자 기록 수정"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="date">날짜</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="investment">투자금액 (원)</Label>
          <Input id="investment" type="number" placeholder="1,000,000" value={investmentAmount} onChange={(e) => setInvestmentAmount(e.target.value)} required min="0" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="buyPrice">매수 시세 (원)</Label>
          <div className="space-y-2">
            <Input id="buyPrice" type="number" placeholder="100,000,000" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} required min="0" />
            {currentPrice && (
              <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto text-xs" onClick={() => setBuyPrice(currentPrice.toString())}>
                현재가 적용 ({currentPrice.toLocaleString()}원)
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>매수 수량</Label>
          <div className="h-10 px-3 py-2 border border-input rounded-md bg-muted text-sm flex items-center">
            {calculateBTCAmount() > 0 ? formatBTC(calculateBTCAmount()) : "0 BTC"}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">메모 (선택사항)</Label>
          <Input id="notes" placeholder="매수 이유 또는 기타 메모" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={!investmentAmount || !buyPrice || parseFloat(investmentAmount) <= 0 || parseFloat(buyPrice) <= 0}>
        {buttonText}
      </Button>
    </form>
  )
}
