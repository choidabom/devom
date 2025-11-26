"use client"

import { DesktopContent } from "@/components/desktop/DesktopContent"
import { ApplicationProvider } from "@/context/ApplicationContext"
import { JSX } from "react"

export const Desktop = (): JSX.Element => {
  return (
    <ApplicationProvider>
      <DesktopContent />
    </ApplicationProvider>
  )
}
