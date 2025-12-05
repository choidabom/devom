"use client"

import { DocumentProvider, useConnection, useDocument, usePresences, YorkieProvider as YorkieProviderBase } from "@yorkie-js/react"
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export interface Presence {
  name: string
  color: string
  cursor?: {
    x: number
    y: number
  }
  message?: string
  messageTimestamp?: number
  [key: string]: string | number | { x: number; y: number } | undefined
}

interface YorkieContextValue {
  presences: Map<string, Presence>
  currentPresence: Presence | null
  updatePresence: (updates: Partial<Presence>) => void
  connection: "connected" | "disconnected"
}

const YorkieContext = createContext<YorkieContextValue | null>(null)

const YORKIE_API_KEY = process.env.YORKIE_API_KEY || ""

const colors = [
  "#FF6B6B", // 빨강
  "#4ECDC4", // 청록
  "#45B7D1", // 파랑
  "#FFA07A", // 연한 연어색
  "#98D8C8", // 민트
  "#F7DC6F", // 노랑
  "#BB8FCE", // 보라
  "#85C1E2", // 하늘색
]

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)]

const generateUserId = () => `user-${Math.random().toString(36).substring(2, 9)}`

function YorkieContextProvider({ children, initialPresence }: { children: ReactNode; initialPresence: Presence }) {
  const { update, doc } = useDocument<Record<string, unknown>>()
  const presencesArray = usePresences()
  const connection = useConnection()
  const [currentPresence, setCurrentPresence] = useState<Presence | null>(initialPresence)

  // 초기 presence 설정
  useEffect(() => {
    if (doc && initialPresence) {
      update((_root, presence) => {
        const currentPresence = presence as unknown as Presence
        if (!currentPresence || !currentPresence.name) {
          // presence.set()을 사용하여 초기 presence 설정
          if (typeof (presence as any).set === "function") {
            ;(presence as any).set(initialPresence)
          } else {
            // set 메서드가 없으면 Object.assign 사용
            Object.assign(presence, initialPresence)
          }
          setCurrentPresence(initialPresence)
        } else {
          setCurrentPresence(currentPresence)
        }
      })
    }
  }, [doc, initialPresence, update])

  // presence 변경 감지 및 currentPresence 업데이트
  useEffect(() => {
    if (!doc) return

    try {
      const myPresence = doc.getMyPresence() as unknown as Presence
      if (myPresence) {
        setCurrentPresence(myPresence)
      }
    } catch {
      // getMyPresence가 실패할 수 있으므로 무시
    }
  }, [doc, presencesArray])

  const presences = useMemo(() => {
    const presencesMap = new Map<string, Presence>()

    // usePresences()는 이미 다른 사용자들의 presence만 반환합니다
    presencesArray.forEach(({ clientID, presence }) => {
      if (presence) {
        const typedPresence = presence as unknown as Presence
        // 내 presence인지 확인 (이름과 색상으로 비교)
        const isMe = currentPresence && typedPresence.name === currentPresence.name && typedPresence.color === currentPresence.color

        if (!isMe) {
          presencesMap.set(clientID, typedPresence)
        }
      }
    })
    return presencesMap
  }, [presencesArray, currentPresence])

  const updatePresence = (updates: Partial<Presence>) => {
    if (!doc) return

    update((_root, presence) => {
      // presence.set()을 사용하여 업데이트 (Yorkie가 자동으로 병합)
      presence.set(updates)
    })

    setCurrentPresence((prev) => {
      if (!prev) return null
      return { ...prev, ...updates } as Presence
    })
  }

  return <YorkieContext.Provider value={{ presences, currentPresence, updatePresence, connection }}>{children}</YorkieContext.Provider>
}

export function YorkieProvider({ children }: { children: ReactNode }) {
  const userId = generateUserId()
  const userColor = getRandomColor()

  const initialPresence: Presence = {
    name: `User ${userId.slice(-4)}`,
    color: userColor || "#4ade80",
  }

  return (
    <YorkieProviderBase apiKey={YORKIE_API_KEY}>
      <DocumentProvider docKey="cursor-chat" initialRoot={{}}>
        <YorkieContextProvider initialPresence={initialPresence}>{children}</YorkieContextProvider>
      </DocumentProvider>
    </YorkieProviderBase>
  )
}

export function useYorkie() {
  const context = useContext(YorkieContext)
  if (!context) {
    throw new Error("useYorkie must be used within YorkieProvider")
  }
  return context
}
