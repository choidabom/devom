"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/Sheet";
import { useBitcoinPrice } from "@/hooks/useBitcoinPrice";
import { useInvestments } from "@/hooks/useInvestments";
import type { Investment } from "@/types/bitcoin";
import { useState } from "react";
import { BitcoinPriceCard } from "./BitcoinPriceCard";
import { InvestmentForm } from "./InvestmentForm";
import { InvestmentList } from "./InvestmentList";
import { PortfolioSummary } from "./PortfolioSummary";

export function BitcoinDashboard() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(
    null
  );
  const [formMode, setFormMode] = useState<"add" | "edit">("add");

  const { price, isLoading, refetch } = useBitcoinPrice();
  const {
    investments,
    addInvestment,
    removeInvestment,
    updateInvestment,
    calculatePortfolioSummary,
  } = useInvestments();

  const currentPrice = price?.price || 0;
  const portfolioSummary = calculatePortfolioSummary(currentPrice);

  const handleAddInvestment = (
    investment: Omit<Investment, "id" | "btcAmount">
  ) => {
    addInvestment(investment);
    setIsFormOpen(false);
  };

  const handleUpdateInvestment = (
    id: string,
    investment: Omit<Investment, "id" | "btcAmount">
  ) => {
    const btcAmount = investment.investmentAmount / investment.buyPrice;
    updateInvestment(id, { ...investment, btcAmount });
    setIsFormOpen(false);
    setEditingInvestment(null);
  };

  const handleAddNewClick = () => {
    setFormMode("add");
    setEditingInvestment(null);
    setIsFormOpen(true);
  };

  const handleEditInvestment = (investment: Investment) => {
    setFormMode("edit");
    setEditingInvestment(investment);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingInvestment(null);
  };

  const drawerTitle =
    formMode === "add" ? "새 투자 기록 추가" : "투자 기록 수정";
  const drawerDescription =
    formMode === "add"
      ? "비트코인 투자 기록을 추가하여 포트폴리오를 관리하세요."
      : "투자 기록을 수정하여 정확한 포트폴리오를 유지하세요.";

  return (
    <div className="space-y-8">
      {/* 현재 시세 */}
      <BitcoinPriceCard
        price={price}
        isLoading={isLoading}
        onRefresh={refetch}
      />

      {/* 포트폴리오 요약 */}
      <PortfolioSummary summary={portfolioSummary} />

      {/* 투자 기록 목록 (메인) */}
      <InvestmentList
        investments={investments}
        currentPrice={currentPrice}
        onRemoveInvestment={removeInvestment}
        onAddNewClick={handleAddNewClick}
        onEditInvestment={handleEditInvestment}
      />

      {/* 투자 기록 추가/수정 Drawer */}
      <Sheet open={isFormOpen} onOpenChange={handleFormClose}>
        <SheetContent className="w-[400px] sm:w-[450px]">
          <SheetHeader className="mb-6">
            <SheetTitle>{drawerTitle}</SheetTitle>
            <SheetDescription>{drawerDescription}</SheetDescription>
          </SheetHeader>
          <InvestmentForm
            mode={formMode}
            editingInvestment={editingInvestment}
            onAddInvestment={handleAddInvestment}
            onUpdateInvestment={handleUpdateInvestment}
            currentPrice={currentPrice}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
