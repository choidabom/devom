"use client"

import { ApplicationProvider } from "@/context/ApplicationContext"
import { CardsProvider } from "@/context/CardsProvider"
import { ThemeProvider } from "next-themes"
import { ReactNode } from "react"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ApplicationProvider>
        <CardsProvider>{children}</CardsProvider>
      </ApplicationProvider>
    </ThemeProvider>
  )
}
