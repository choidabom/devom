"use client";

import type { Investment, PortfolioSummary } from "@/types/bitcoin";
import { useEffect, useState } from "react";

const STORAGE_KEY = "bitcoin-investments";

export function useInvestments() {
  const [investments, setInvestments] = useState<Investment[]>([]);

  // 로컬 스토리지에서 투자 기록 로드
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setInvestments(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse stored investments:", error);
      }
    }
  }, []);

  // 투자 기록이 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(investments));
  }, [investments]);

  const addInvestment = (investment: Omit<Investment, "id" | "btcAmount">) => {
    const newInvestment: Investment = {
      ...investment,
      id: Date.now().toString(),
      btcAmount: investment.investmentAmount / investment.buyPrice,
    };
    setInvestments((prev) => [...prev, newInvestment]);
  };

  const removeInvestment = (id: string) => {
    setInvestments((prev) => prev.filter((inv) => inv.id !== id));
  };

  const updateInvestment = (
    id: string,
    updatedData: Omit<Investment, "id">
  ) => {
    setInvestments((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? {
              ...updatedData,
              id,
              btcAmount: updatedData.investmentAmount / updatedData.buyPrice,
            }
          : inv
      )
    );
  };

  const calculatePortfolioSummary = (
    currentPrice: number
  ): PortfolioSummary => {
    if (investments.length === 0) {
      return {
        totalInvestment: 0,
        totalBTC: 0,
        currentValue: 0,
        totalProfit: 0,
        totalProfitPercentage: 0,
        averageBuyPrice: 0,
      };
    }

    const totalInvestment = investments.reduce(
      (sum, inv) => sum + inv.investmentAmount,
      0
    );
    const totalBTC = investments.reduce((sum, inv) => sum + inv.btcAmount, 0);
    const currentValue = totalBTC * currentPrice;
    const totalProfit = currentValue - totalInvestment;
    const totalProfitPercentage = (totalProfit / totalInvestment) * 100;
    const averageBuyPrice = totalInvestment / totalBTC;

    return {
      totalInvestment,
      totalBTC,
      currentValue,
      totalProfit,
      totalProfitPercentage,
      averageBuyPrice,
    };
  };

  return {
    investments,
    addInvestment,
    removeInvestment,
    updateInvestment,
    calculatePortfolioSummary,
  };
}
