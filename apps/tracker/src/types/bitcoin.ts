export interface BitcoinPrice {
  price: number
  timestamp: number
  change?: "EVEN" | "RISE" | "FALL" // 전일 대비 변화
  changeRate?: number // 변화율
  changePrice?: number // 변화가격
  high?: number // 당일 최고가
  low?: number // 당일 최저가
  volume?: number // 24시간 거래량
}

export interface Investment {
  id: string
  date: string
  investmentAmount: number
  buyPrice: number
  btcAmount: number
  notes?: string
}

export interface PortfolioSummary {
  totalInvestment: number
  totalBTC: number
  currentValue: number
  totalProfit: number
  totalProfitPercentage: number
  averageBuyPrice: number
}
