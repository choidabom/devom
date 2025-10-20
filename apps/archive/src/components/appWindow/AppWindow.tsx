import type { JSX } from "react"
import { useRef, useState } from "react"
import { useWindowControls } from "../../hooks/useWindowControls"
import { useWindowSize } from "../../hooks/useWindowsize"
import type { Application } from "../../types/types"
import RnD from "../RnD"
import WindowControls from "./WindowControls"

export const MIN_WIDTH = 500
export const MIN_HEIGHT = 400

interface AppWindowProps {
  app: Application
  onZIndex: () => void
}

const AppWindow = (props: AppWindowProps): JSX.Element | null => {
  const { app, onZIndex } = props
  const config = app.config
  const appWindowRef = useRef<HTMLDivElement>(null)
  const { width: windowWidth, height: windowHeight } = useWindowSize()

  const [windowState, windowActions] = useWindowControls()
  const { isClosed, isMinimized, isMaximized, isAnimating } = windowState
  const { handleClose, handleMinimize, handleMaximize } = windowActions

  const [{ x, y, w, h }, setAppRect] = useState({
    x: config.left ?? 100,
    y: config.top ?? 100,
    w: config.width ?? MIN_WIDTH,
    h: config.height ?? MIN_HEIGHT,
  })

  if (isClosed) {
    return null
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
          className={`flex flex-col overflow-hidden rounded-lg shadow-lg shadow-black/40 border border-gray-100 ${isAnimating ? "minimize-animation" : ""}`}
          onZIndex={onZIndex}
        >
          <WindowControls
            isMaximized={isMaximized}
            appRect={{ x, y, w, h }}
            onSetAppRect={setAppRect}
            onClose={handleClose}
            onMinimize={handleMinimize}
            onMaximize={handleMaximize}
          />
          <div className="main-content h-screen flex-grow overflow-y-auto overflow-x-hidden bg-white">{app.component}</div>
        </RnD>
      )}
    </>
  )
}

export default AppWindow
