import type { JSX } from "react";
import { registerDragEvent } from "../../utils/registerDragEvent";
import { CloseIcon } from "../icon/CloseIcon";
import { MaximizeIcon } from "../icon/MaximizeIcon";
import { MinimizeIcon } from "../icon/MinimizeIcon";

interface WindowControlsProps {
  isMaximized: boolean;
  appRect: { x: number; y: number; w: number; h: number };
  onSetAppRect: (DOMRect: { x: number; y: number; w: number; h: number }) => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}

const WindowControls = (props: WindowControlsProps): JSX.Element => {
  const { isMaximized, appRect, onSetAppRect, onClose, onMinimize, onMaximize } = props;

  return (
    <div
      className={"flex items-center justify-between p-2 bg-white"}
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
    </div>
  );
};

export default WindowControls;
