"use client"

import { Cursor } from "@/components/cursorChat/Cursor"
import "@/components/cursorChat/CursorChat.css"
import { useYorkie } from "@/context/YorkieContext"
import { useCallback, useEffect, useRef, useState, type JSX } from "react"

export function CursorChat(): JSX.Element {
  const { presences, currentPresence, updatePresence } = useYorkie()
  const [chatOpen, setChatOpen] = useState(false)

  const [isClosing, setIsClosing] = useState(false)
  const [message, setMessage] = useState("")
  const [cursorPosition, setCursorPosition] = useState({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fadeOutTimerRef = useRef<NodeJS.Timeout | null>(null)
  const prevChatOpenRef = useRef<boolean>(false)
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null)

  // 컴포넌트 마운트 시 마우스 위치 초기화
  useEffect(() => {
    // 마우스가 이미 움직였을 수 있으므로, 마지막 위치가 있으면 사용
    if (lastMousePositionRef.current) {
      setCursorPosition(lastMousePositionRef.current)
    }
  }, [])

  // 마우스 움직임 추적 (항상 실행하여 마지막 위치 저장)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX
      const y = e.clientY
      lastMousePositionRef.current = { x, y }

      // 채팅 모드일 때만 presence 업데이트
      if (chatOpen) {
        setCursorPosition({ x, y })
        updatePresence({
          cursor: { x, y },
        })
      }
    }

    // mousemove뿐만 아니라 mousedown, mouseenter 등도 감지하여 초기 위치 파악
    const handleMouseEvent = (e: MouseEvent) => {
      const x = e.clientX
      const y = e.clientY
      if (!lastMousePositionRef.current) {
        lastMousePositionRef.current = { x, y }
        setCursorPosition({ x, y })
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mousedown", handleMouseEvent)
    window.addEventListener("mouseenter", handleMouseEvent)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mousedown", handleMouseEvent)
      window.removeEventListener("mouseenter", handleMouseEvent)
    }
  }, [chatOpen, updatePresence])

  // 채팅 모드 열릴 때 현재 마우스 위치로 초기화, 닫힐 때 상태 초기화
  useEffect(() => {
    // chatOpen이 false에서 true로 변경될 때 - 현재 마우스 위치로 초기화
    if (!prevChatOpenRef.current && chatOpen) {
      // 마지막으로 알려진 마우스 위치가 있으면 사용
      if (lastMousePositionRef.current) {
        const { x, y } = lastMousePositionRef.current
        setCursorPosition({ x, y })
        updatePresence({
          cursor: { x, y },
        })
      } else {
        // 마지막 위치가 없으면 마우스 움직임을 기다림
        const handleMouseMoveOnce = (e: MouseEvent) => {
          const x = e.clientX
          const y = e.clientY
          setCursorPosition({ x, y })
          updatePresence({
            cursor: { x, y },
          })
          window.removeEventListener("mousemove", handleMouseMoveOnce)
        }
        window.addEventListener("mousemove", handleMouseMoveOnce)
      }
    }

    // chatOpen이 true에서 false로 변경될 때만 실행
    if (prevChatOpenRef.current && !chatOpen) {
      setIsClosing(false)
      // 커서 정보 제거
      updatePresence({ cursor: undefined })
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      if (fadeOutTimerRef.current) {
        clearTimeout(fadeOutTimerRef.current)
        fadeOutTimerRef.current = null
      }
    }

    prevChatOpenRef.current = chatOpen

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
      if (fadeOutTimerRef.current) {
        clearTimeout(fadeOutTimerRef.current)
      }
    }
  }, [chatOpen, updatePresence])

  const closeChat = useCallback(() => {
    setIsClosing(false)
    setChatOpen(false)
    setMessage("")
    updatePresence({ message: undefined, messageTimestamp: undefined, cursor: undefined })
  }, [updatePresence])

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !chatOpen) {
        e.preventDefault()
        setChatOpen(true)
      } else if (e.key === "Escape" && chatOpen) {
        closeChat()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [chatOpen, closeChat])

  // 마우스 클릭 시 채팅 닫기 (Esc와 동일하게 동작)
  useEffect(() => {
    if (!chatOpen) return

    const handleClick = (e: MouseEvent) => {
      // input이나 form 내부 클릭은 무시
      const target = e.target as HTMLElement
      if (inputRef.current && (inputRef.current.contains(target) || target.closest("form"))) {
        return
      }
      closeChat()
    }

    window.addEventListener("click", handleClick)

    return () => {
      window.removeEventListener("click", handleClick)
    }
  }, [chatOpen, closeChat])

  // 채팅이 열려있을 때 항상 input에 focus 유지
  useEffect(() => {
    if (chatOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [chatOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      // 기존 타이머 정리
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
      if (fadeOutTimerRef.current) {
        clearTimeout(fadeOutTimerRef.current)
      }

      // 메시지는 이미 onChange에서 전송되었으므로 여기서는 타이머만 설정
      setMessage("")
      setChatOpen(false)

      // 메시지 확정 후 9초 후 페이드아웃 시작
      fadeOutTimerRef.current = setTimeout(() => {
        setIsClosing(true)
      }, 9000)

      // 메시지 확정 후 10초 후 완전히 제거
      closeTimerRef.current = setTimeout(() => {
        setIsClosing(false)
        updatePresence({ message: undefined, messageTimestamp: undefined, cursor: undefined })
        closeTimerRef.current = null
        fadeOutTimerRef.current = null
      }, 10000)
    }
  }

  return (
    <>
      {/* 채팅 입력창 - 커서를 따라 이동 */}
      {chatOpen && (
        <div
          className={`chatInputContainer ${isClosing ? "closing" : ""}`}
          style={{
            position: "fixed",
            left: `${cursorPosition.x + 16}px`,
            top: `${cursorPosition.y + 8}px`,
            zIndex: 9999,
            pointerEvents: "auto",
          }}
        >
          <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
            <textarea
              ref={inputRef as any}
              value={message}
              onChange={(e) => {
                const newMessage = e.target.value
                setMessage(newMessage)
                // 실시간으로 입력 내용 전송
                updatePresence({
                  message: newMessage.trim() || undefined,
                  messageTimestamp: newMessage.trim() ? Date.now() : undefined,
                })
              }}
              placeholder="Say something..."
              className="chatInput"
              autoFocus
              rows={1}
              style={{
                backgroundColor: currentPresence?.color || "#4ade80",
                boxShadow: currentPresence?.color
                  ? `0 0 20px ${currentPresence.color}66, 0 4px 12px rgba(0, 0, 0, 0.15)`
                  : "0 0 20px rgba(74, 222, 128, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)",
                padding: "8px 16px",
                borderRadius: "16px",
                border: "none",
                color: "white",
                fontSize: "14px",
                fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
                fontWeight: 500,
                letterSpacing: "0.5px",
                lineHeight: "1.4",
                width: "200px",
                outline: "none",
                resize: "none",
                overflow: "hidden",
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
              onFocus={(e) => {
                if (currentPresence?.color) {
                  e.target.style.boxShadow = `0 0 25px ${currentPresence.color}80, 0 4px 12px rgba(0, 0, 0, 0.15)`
                }
              }}
              onBlur={(e) => {
                // 채팅이 열려있으면 다시 focus
                if (chatOpen) {
                  setTimeout(() => {
                    e.target.focus()
                  }, 0)
                } else {
                  if (currentPresence?.color) {
                    e.target.style.boxShadow = `0 0 20px ${currentPresence.color}66, 0 4px 12px rgba(0, 0, 0, 0.15)`
                  }
                }
              }}
              onInput={(e) => {
                // 자동으로 높이 조절
                const target = e.target as HTMLTextAreaElement
                target.style.height = "auto"
                target.style.height = `${target.scrollHeight}px`
              }}
              maxLength={200}
              autoComplete="off"
            />
          </form>
        </div>
      )}

      {/* 다른 사용자들의 커서 렌더링 */}
      {/* usePresences()는 이미 다른 사용자들만 반환하므로 필터링 불필요 */}
      {Array.from(presences.entries()).map(([clientId, presence]) => (
        <Cursor key={clientId} presence={presence} />
      ))}
    </>
  )
}
