import { useState } from "react";

export interface WindowState {
  isClosed: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  isAnimating: boolean;
}

export interface WindowActions {
  handleClose: () => void;
  handleMinimize: () => void;
  handleMaximize: () => void;
}

export const useWindowControls = (): [WindowState, WindowActions] => {
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const handleClose = (): void => {
    setIsClosed(true);
  };

  const handleMinimize = (): void => {
    if (isMaximized) {
      return;
    }
    setIsAnimating(true);
    setTimeout(() => {
      setIsMinimized(true);
      setIsAnimating(false);
    }, 500);
  };

  const handleMaximize = (): void => {
    setIsMaximized(!isMaximized);
  };

  return [
    { isClosed, isMinimized, isMaximized, isAnimating },
    { handleClose, handleMinimize, handleMaximize },
  ];
};
