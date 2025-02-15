/**
 * 1. 브라우저 환경에서 실행되고 있는지 확인 (브라우저 환경에서는 window 객체 정의됨. but, 서버 사이드 환경(Node.js)에서는 window 객체 정의 안 됨.)
 * 2. matchMedia 메서드는 미디어 쿼리 문자열을 방사 현재 문서와 일치하는지 여부를 나타내는 MediaQueryList 객체를 반환
 */
const isTouchScreen = typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches;

type DragEventHandlers = {
    onTouchStart?: (event: React.TouchEvent<HTMLDivElement>) => void;
    onMouseDown?: (event: React.MouseEvent<Element, MouseEvent>) => void;
};

export const registerDragEvent = (
    onDragChange: (deltaX: number, deltaY: number) => void,
    stopPropagation?: boolean,
): DragEventHandlers => {
    if (isTouchScreen) {
        return {
            onTouchStart: (touchEvent: React.TouchEvent<HTMLDivElement>): void => {
                if (stopPropagation) {
                    touchEvent.stopPropagation();
                }

                const handleTouchMove = (moveEvent: TouchEvent): void => {
                    if (moveEvent.cancelable) {
                        moveEvent.preventDefault();
                    }

                    if (moveEvent.touches?.[0] && touchEvent.touches?.[0]) {
                        const deltaX = moveEvent.touches[0].screenX - touchEvent.touches[0].screenX;
                        const deltaY = moveEvent.touches[0].screenY - touchEvent.touches[0].screenY;
                
                        onDragChange(deltaX, deltaY);
                    }
                };
                const handleTouchEnd = (): void => {
                    document.removeEventListener('touchmove', handleTouchMove);
                };

                document.addEventListener('touchmove', handleTouchMove, { passive: false });
                document.addEventListener('touchend', handleTouchEnd, { once: true });
            },
        };
    }

    return {
        onMouseDown: (clickEvent: React.MouseEvent<Element, MouseEvent>): void => {
            clickEvent.preventDefault();
            if (stopPropagation) {
                clickEvent.stopPropagation();
            }

            const handleMouseMove = (moveEvent: MouseEvent): void => {
                const deltaX = moveEvent.screenX - clickEvent.screenX;
                const deltaY = moveEvent.screenY - clickEvent.screenY;
                onDragChange(deltaX, deltaY);
            };
            const handleMouseUp = (): void => {
                document.removeEventListener('mousemove', handleMouseMove);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        },
    };
};
