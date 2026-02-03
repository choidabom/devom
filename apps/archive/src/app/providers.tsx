"use client"

import { CardsProvider } from "@/context/CardsProvider"
import { queryClient } from "@/utils/queryClient"
import { QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { ReactNode } from "react"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false} storageKey="devom-theme">
        <CardsProvider>{children}</CardsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
