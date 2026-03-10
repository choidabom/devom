interface InsertionIndicatorProps {
  x: number
  y: number
  width: number
  height: number
}

export function InsertionIndicator({ x, y, width, height }: InsertionIndicatorProps) {
  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        width,
        height,
        backgroundColor: '#3b82f6',
        borderRadius: 1,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  )
}
