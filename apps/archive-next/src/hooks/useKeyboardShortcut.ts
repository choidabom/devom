import { useCallback, useEffect } from "react";

interface UseKeyboardShortcutOptions {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  onKeyDown?: () => void;
  onKeyUp?: () => void;
}

export function useKeyboardShortcut({ key, metaKey = false, ctrlKey = false, shiftKey = false, altKey = false, onKeyDown, onKeyUp }: UseKeyboardShortcutOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === key.toLowerCase() && event.metaKey === metaKey && event.ctrlKey === ctrlKey && event.shiftKey === shiftKey && event.altKey === altKey) {
        event.preventDefault();
        onKeyDown?.();
      }
    },
    [key, metaKey, ctrlKey, shiftKey, altKey, onKeyDown]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === key.toLowerCase() && event.metaKey === metaKey && event.ctrlKey === ctrlKey && event.shiftKey === shiftKey && event.altKey === altKey) {
        event.preventDefault();
        onKeyUp?.();
      }
    },
    [key, metaKey, ctrlKey, shiftKey, altKey, onKeyUp]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
}
