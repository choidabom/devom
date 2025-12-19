"use client"

import { ApplicationProvider } from "@/context/ApplicationContext"
import { CardsProvider } from "@/context/CardsProvider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { ReactNode } from "react"

interface ProvidersProps {
  children: ReactNode
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
    },
  },
})

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <ApplicationProvider>
          <CardsProvider>{children}</CardsProvider>
        </ApplicationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
