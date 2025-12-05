"use client"

import { ApplicationProvider } from "@/context/ApplicationContext"
import { CardsProvider } from "@/context/CardsProvider"
import { YorkieProvider } from "@/context/YorkieContext"
import { ThemeProvider } from "next-themes"
import { ReactNode } from "react"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <YorkieProvider>
        <ApplicationProvider>
          <CardsProvider>{children}</CardsProvider>
        </ApplicationProvider>
      </YorkieProvider>
    </ThemeProvider>
  )
}
