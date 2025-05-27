import { useState, useEffect } from "react";

export function useSlashCommand() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에 포커스가 있을 때는 무시
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      // 슬래시 키 입력 시 채팅 버블 활성화
      if (e.key === "/" && !isVisible) {
        e.preventDefault();
        setIsVisible(true);
      }

      // ESC 키로 닫기
      if (e.key === "Escape" && isVisible) {
        setIsVisible(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVisible]);

  const closeChat = () => {
    setIsVisible(false);
  };

  return {
    isVisible,
    closeChat,
  };
}
