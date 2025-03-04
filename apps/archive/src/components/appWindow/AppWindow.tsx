import type { JSX } from "react";
import { useRef, useState } from "react";
import { useWindowSize } from "../../hooks/useWindowsize";
import type { Application } from "../../types/types";
import RnD from "../RnD";
import AppWindowHeader from "./AppWindowHeader";

export const MIN_WIDTH = 500;
export const MIN_HEIGHT = 400;

interface AppWindowProps {
  app: Application;
  onZIndex: () => void;
}

const AppWindow = (props: AppWindowProps): JSX.Element | null => {
  const { app, onZIndex } = props;
  const appWindowRef = useRef<HTMLDivElement>(null);
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const config = app.config;

  const [{ x, y, w, h }, setAppRect] = useState({
    x: config.left ?? 100,
    y: config.top ?? 100,
    w: config.width ?? MIN_WIDTH,
    h: config.height ?? MIN_HEIGHT,
  });

  const [isClosed, setIsClosed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

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

  if (isClosed) {
    return null;
  }

  return (
    <>
      {!isMinimized && (
        <RnD
          ref={appWindowRef}
          size={{
            width: isMaximized ? windowWidth : w,
            height: isMaximized ? windowHeight : h,
          }}
          position={{
            x: isMaximized ? 0 : x,
            y: isMaximized ? 0 : y,
          }}
          zIndex={config.zIndex}
          minWidth={config.minWidth ?? MIN_WIDTH}
          minHeight={config.minHeight ?? MIN_HEIGHT}
          windowWidth={windowWidth}
          windowHeight={windowHeight}
          disableResizeControl={config.disableResizeControl}
          updateRnDRect={setAppRect}
          className={`flex flex-col overflow-hidden rounded-lg shadow-lg shadow-black/30 ${isAnimating ? "minimize-animation" : ""}`}
          onZIndex={onZIndex}
        >
          <AppWindowHeader
            appName={app.name}
            isMaximized={isMaximized}
            appRect={{ x, y, w, h }}
            disableResizeControl={config.disableResizeControl}
            onSetAppRect={setAppRect}
            onClose={handleClose}
            onMinimize={handleMinimize}
            onMaximize={handleMaximize}
          />
          <div className="main-content h-screen flex-grow overflow-y-auto overflow-x-hidden bg-white">
            {app.component}
          </div>
        </RnD>
      )}
    </>
  );
};

export default AppWindow;
