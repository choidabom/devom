import type { JSX } from "react";
import { registerDragEvent } from "../../utils/registerDragEvent";
import { CloseIcon } from "../icon/CloseIcon";
import { MaximizeIcon } from "../icon/MaximizeIcon";
import { MinimizeIcon } from "../icon/MinimizeIcon";

interface AppWindowHeaderProps {
  appName: string;
  isMaximized: boolean;
  appRect: { x: number; y: number; w: number; h: number };
  disableResizeControl?: boolean;
  onSetAppRect: (DOMRect: {
    x: number;
    y: number;
    w: number;
    h: number;
  }) => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}

const AppWindowHeader = (props: AppWindowHeaderProps): JSX.Element => {
  const { appName, isMaximized, appRect, disableResizeControl, onSetAppRect, onClose, onMinimize, onMaximize } = props;

  return (
    <div
      className={`flex items-center justify-between ${disableResizeControl ? "bg-macosGray" : "bg-gray-200 bg-opacity-70"} p-2`}
      onDoubleClick={onMaximize}
      {...registerDragEvent((deltaX: number, deltaY: number) => {
        onSetAppRect({
          x: appRect.x + deltaX,
          y: Math.max(0, appRect.y + deltaY),
          w: appRect.w,
          h: appRect.h,
        });
      })}
    >
      <div className="m-1 flex space-x-2">
        <button type="button" className={"group relative flex h-3 w-3 items-center justify-center rounded-full bg-red-500"} onClick={onClose}>
          <CloseIcon />
        </button>
        <button
          type="button"
          className={`relative h-3 w-3 rounded-full ${isMaximized ? "bg-gray-500" : "bg-yellow-500"} group flex items-center justify-center`}
          onClick={onMinimize}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          {!isMaximized && <MinimizeIcon />}
        </button>
        <button type="button" className={"group relative flex h-3 w-3 items-center justify-center rounded-full bg-green-500"} onClick={onMaximize}>
          <MaximizeIcon />
        </button>
      </div>
      <div className="flex-1 text-center">
        <span className={`text-sm ${disableResizeControl ? "text-white" : "text-gray-700"}`}>{appName}</span>
      </div>
      <div className="w-12" />
    </div>
  );
};

export default AppWindowHeader;
