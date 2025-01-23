import type { JSX } from 'react';
import { useRef, useState } from 'react';
import type Application from '../../Application';
import { useWindowSize } from '../../hooks/useWindowsize';
import AppWindowHeader from './AppWindowHeader';
import RnD from '../RnD';

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
    const [{ x, y, w, h }, setAppRect] = useState({
        x: app.left ?? 100,
        y: app.top ?? 100,
        w: app.width ?? MIN_WIDTH,
        h: app.height ?? MIN_HEIGHT,
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
                    zIndex={app.zIndex}
                    minWidth={app.minWidth ?? MIN_WIDTH}
                    minHeight={app.minHeight ?? MIN_HEIGHT}
                    windowWidth={windowWidth}
                    windowHeight={windowHeight}
                    disableResizeControl={app.disableResizeControl}
                    updateRnDRect={setAppRect}
                    className={`flex flex-col overflow-hidden rounded-lg shadow-lg shadow-black/30 ${isAnimating ? 'minimize-animation' : ''}`}
                    onZIndex={onZIndex}
                >
                    <AppWindowHeader
                        appName={app.appName}
                        isMaximized={isMaximized}
                        appRect={{ x, y, w, h }}
                        disableResizeControl={app.disableResizeControl}
                        onSetAppRect={setAppRect}
                        onClose={handleClose}
                        onMinimize={handleMinimize}
                        onMaximize={handleMaximize}
                    />
                    <div className="main-content h-screen flex-grow overflow-y-auto overflow-x-hidden bg-white">
                        {app.content}
                    </div>
                </RnD>
            )}
        </>
    );
};

export default AppWindow;
