"use client"

import "@/components/cursorChat/UserCount.css"
import { useYorkie } from "@/context/YorkieContext"
import { type JSX } from "react"

export function UserCount(): JSX.Element {
  const { presences } = useYorkie()

  // 다른 사용자 수 + 자신 = 총 온라인 사용자 수
  const onlineCount = presences.size + 1

  const getMessage = () => {
    if (onlineCount === 1) {
      return "Alone"
    }
    return `${onlineCount} online`
  }

  return <div className="userCount">{getMessage()}</div>
}
