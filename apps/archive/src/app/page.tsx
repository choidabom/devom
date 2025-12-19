"use client"

import { UserMenu } from "@/components/auth/UserMenu"
import { Calendar } from "@/components/portfolio/Calendar"
import { Portfolio } from "@/components/portfolio/Portfolio"

export default function Home() {
  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9999,
        }}
      >
        <UserMenu />
      </div>
      <Calendar />
      <Portfolio />
    </>
  )
}
