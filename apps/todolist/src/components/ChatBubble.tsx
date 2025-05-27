import { useState, useEffect, useRef } from "react";

interface ChatBubbleProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  placeholder?: string;
  autoFocusDelay?: number;
  autoCloseDelay?: number;
}

export function ChatBubble({
  isVisible,
  onClose,
  onSubmit,
  placeholder = "메시지를 입력하세요...",
  autoFocusDelay = 100,
  autoCloseDelay = 5000,
}: ChatBubbleProps) {
  const [message, setMessage] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<number>();
  const closeTimeoutRef = useRef<number>();

  // 마우스 위치 추적
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 컴포넌트가 보일 때 애니메이션 시작 및 포커스
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);

      // 입력 필드에 포커스
      const focusTimeout = setTimeout(() => {
        inputRef.current?.focus();
      }, autoFocusDelay);

      // 자동 닫기 타이머
      closeTimeoutRef.current = window.setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => {
        clearTimeout(focusTimeout);
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }
      };
    } else {
      setIsAnimating(false);
      setMessage("");
    }
  }, [isVisible, autoFocusDelay, autoCloseDelay]);

  // 입력값 변경 시 자동 닫기 타이머 리셋
  useEffect(() => {
    if (message.trim() && closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = window.setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
    }
  }, [message, autoCloseDelay]);

  // 컴포넌트 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    setIsAnimating(false);
    timeoutRef.current = window.setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit(message.trim());
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isVisible && !isAnimating) return null;

  // 동적 크기 계산 - 텍스트 길이에 따라 조정
  const minWidth = 320;
  const maxWidth = 600;
  const charWidth = 8;
  const padding = 80;
  const calculatedWidth = Math.min(
    maxWidth,
    Math.max(minWidth, message.length * charWidth + padding)
  );

  const bubbleHeight = 80;
  const offset = 20;

  // 화면 경계를 고려한 위치 조정
  let left = mousePosition.x + offset;
  let top = mousePosition.y + offset;

  // 오른쪽 경계 체크
  if (left + calculatedWidth > window.innerWidth) {
    left = mousePosition.x - calculatedWidth - offset;
  }

  // 하단 경계 체크
  if (top + bubbleHeight > window.innerHeight) {
    top = mousePosition.y - bubbleHeight - offset;
  }

  // 최소 여백 보장
  left = Math.max(10, Math.min(left, window.innerWidth - calculatedWidth - 10));
  top = Math.max(10, Math.min(top, window.innerHeight - bubbleHeight - 10));

  // 말풍선 꼬리 위치 계산
  const isMouseLeft = mousePosition.x < left + calculatedWidth / 2;
  const isMouseTop = mousePosition.y < top;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        className={`
          absolute bg-white rounded-2xl shadow-2xl border border-gray-200
          transition-all duration-200 ease-out pointer-events-auto
          ${
            isAnimating && isVisible
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95"
          }
        `}
        style={{
          left: `${left}px`,
          top: `${top}px`,
          width: `${calculatedWidth}px`,
          transform:
            isAnimating && isVisible ? "translateY(0)" : "translateY(-10px)",
        }}
      >
        {/* 말풍선 꼬리 */}
        <div
          className="absolute w-4 h-4 bg-white border border-gray-200 transform rotate-45"
          style={{
            left: isMouseLeft ? "20px" : "auto",
            right: !isMouseLeft ? "20px" : "auto",
            top: isMouseTop ? "-8px" : "auto",
            bottom: !isMouseTop ? "-8px" : "auto",
            borderTop: !isMouseTop ? "none" : undefined,
            borderLeft: !isMouseTop ? "none" : undefined,
            borderRight: isMouseTop ? "none" : undefined,
            borderBottom: isMouseTop ? "none" : undefined,
          }}
        />

        <form onSubmit={handleSubmit} className="p-4">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm border-none outline-none bg-transparent placeholder-gray-500 transition-all duration-200"
            autoComplete="off"
          />

          {/* 입력 힌트 */}
          <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
            <span>Enter로 전송, Esc로 닫기</span>
            <span>{message.length > 0 && `${message.length}자`}</span>
          </div>
        </form>
      </div>
    </div>
  );
}
