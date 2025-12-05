"use client"

import "@/components/cursorChat/Cursor.css"
import { Presence } from "@/context/YorkieContext"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { useEffect, type JSX } from "react"

interface CursorProps {
  presence: Presence
}

export function Cursor({ presence }: CursorProps): JSX.Element | null {
  // 부드러운 애니메이션을 위한 모션 값
  const x = useMotionValue(presence.cursor?.x || 0)
  const y = useMotionValue(presence.cursor?.y || 0)

  // 스프링 물리를 사용한 부드러운 보간
  const smoothX = useSpring(x, {
    damping: 30,
    stiffness: 300,
    mass: 0.5,
  })

  const smoothY = useSpring(y, {
    damping: 30,
    stiffness: 300,
    mass: 0.5,
  })

  // 커서 위치 업데이트
  useEffect(() => {
    if (presence.cursor) {
      x.set(presence.cursor.x)
      y.set(presence.cursor.y)
    } else {
      // cursor가 없으면 화면 중앙에 표시
      x.set(typeof window !== "undefined" ? window.innerWidth / 2 : 0)
      y.set(typeof window !== "undefined" ? window.innerHeight / 2 : 0)
    }
  }, [presence.cursor, x, y])

  // 메시지가 있으면 말풍선 표시, 없으면 입력창 표시
  // message가 존재하고 비어있지 않은 경우에만 메시지로 간주
  const hasMessage = !!(presence.message && presence.message.trim().length > 0)

  // cursor가 없고 메시지도 없으면 렌더링하지 않음 (채팅 모드를 열지 않은 경우)
  if (!presence.cursor && !hasMessage) {
    return null
  }

  return (
    <motion.div
      className="cursor"
      style={{
        left: smoothX,
        top: smoothY,
        position: "fixed",
        pointerEvents: "none",
        zIndex: 40,
      }}
    >
      {/* 메시지가 있으면 말풍선 표시 */}
      {hasMessage ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2 }}
          className="messageBubble"
          style={{
            position: "absolute",
            left: "0",
            top: "0",
            backgroundColor: presence.color,
            boxShadow: `0 0 20px ${presence.color}66, 0 4px 12px rgba(0, 0, 0, 0.15)`,
            padding: "8px 16px",
            borderRadius: "16px",
            fontSize: "14px",
            lineHeight: "1.4",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            color: "white",
            fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
            fontWeight: 500,
            letterSpacing: "0.5px",
            width: "200px",
          }}
        >
          {presence.message}
        </motion.div>
      ) : (
        /* cursor가 있으면 입력창 표시 (다른 사용자가 채팅 모드를 열었을 때) */
        presence.cursor && (
          <div
            style={{
              position: "absolute",
              left: "0",
              top: "0",
              padding: "8px 16px",
              borderRadius: "16px",
              backgroundColor: presence.color,
              boxShadow: `0 0 20px ${presence.color}66, 0 4px 12px rgba(0, 0, 0, 0.15)`,
              minWidth: "200px",
              maxWidth: "200px",
              fontSize: "14px",
              lineHeight: "1.4",
              color: "rgba(255, 255, 255, 0.7)",
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
              fontWeight: 500,
              letterSpacing: "0.5px",
              whiteSpace: "nowrap",
            }}
          >
            <span>Say something...</span>
          </div>
        )
      )}
    </motion.div>
  )
}
