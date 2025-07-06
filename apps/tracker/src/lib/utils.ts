import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount);
}

export function formatBTC(amount: number): string {
  return `${amount.toFixed(8)} BTC`;
}

export function formatPercentage(percentage: number): string {
  const sign = percentage >= 0 ? "+" : "";
  return `${sign}${percentage.toFixed(2)}%`;
}

export function calculateProfit(investmentAmount: number, buyPrice: number, currentPrice: number): { profit: number; profitPercentage: number; currentValue: number } {
  const btcAmount = investmentAmount / buyPrice;
  const currentValue = btcAmount * currentPrice;
  const profit = currentValue - investmentAmount;
  const profitPercentage = (profit / investmentAmount) * 100;

  return {
    profit,
    profitPercentage,
    currentValue,
  };
}
