export interface Bounds {
  left: number
  top: number
  width: number
  height: number
}

export interface SnapLine {
  axis: "x" | "y"
  position: number
  from: number
  to: number
}

export interface SnapResult {
  dx: number
  dy: number
  lines: SnapLine[]
}

const SNAP_THRESHOLD = 5

export function calcSnap(
  dragged: Bounds,
  others: Bounds[],
): SnapResult {
  let bestDx = Infinity
  let bestDy = Infinity
  const xLines: SnapLine[] = []
  const yLines: SnapLine[] = []

  const dragEdges = {
    left: dragged.left,
    centerX: dragged.left + dragged.width / 2,
    right: dragged.left + dragged.width,
    top: dragged.top,
    centerY: dragged.top + dragged.height / 2,
    bottom: dragged.top + dragged.height,
  }

  for (const other of others) {
    const otherEdges = {
      left: other.left,
      centerX: other.left + other.width / 2,
      right: other.left + other.width,
      top: other.top,
      centerY: other.top + other.height / 2,
      bottom: other.top + other.height,
    }

    // Vertical snap lines (X axis alignment)
    const xPairs: [number, number][] = [
      [dragEdges.left, otherEdges.left],
      [dragEdges.left, otherEdges.right],
      [dragEdges.right, otherEdges.left],
      [dragEdges.right, otherEdges.right],
      [dragEdges.centerX, otherEdges.centerX],
    ]

    for (const [dragVal, otherVal] of xPairs) {
      const diff = otherVal - dragVal
      const absDiff = Math.abs(diff)
      if (absDiff > SNAP_THRESHOLD) continue

      if (absDiff < Math.abs(bestDx)) {
        bestDx = diff
        xLines.length = 0
      }
      if (absDiff === Math.abs(bestDx)) {
        const minY = Math.min(dragEdges.top, otherEdges.top)
        const maxY = Math.max(dragEdges.bottom, otherEdges.bottom)
        xLines.push({ axis: "x", position: otherVal, from: minY, to: maxY })
      }
    }

    // Horizontal snap lines (Y axis alignment)
    const yPairs: [number, number][] = [
      [dragEdges.top, otherEdges.top],
      [dragEdges.top, otherEdges.bottom],
      [dragEdges.bottom, otherEdges.top],
      [dragEdges.bottom, otherEdges.bottom],
      [dragEdges.centerY, otherEdges.centerY],
    ]

    for (const [dragVal, otherVal] of yPairs) {
      const diff = otherVal - dragVal
      const absDiff = Math.abs(diff)
      if (absDiff > SNAP_THRESHOLD) continue

      if (absDiff < Math.abs(bestDy)) {
        bestDy = diff
        yLines.length = 0
      }
      if (absDiff === Math.abs(bestDy)) {
        const minX = Math.min(dragEdges.left, otherEdges.left)
        const maxX = Math.max(dragEdges.right, otherEdges.right)
        yLines.push({ axis: "y", position: otherVal, from: minX, to: maxX })
      }
    }
  }

  return {
    dx: Math.abs(bestDx) <= SNAP_THRESHOLD ? bestDx : 0,
    dy: Math.abs(bestDy) <= SNAP_THRESHOLD ? bestDy : 0,
    lines: [
      ...(Math.abs(bestDx) <= SNAP_THRESHOLD ? xLines : []),
      ...(Math.abs(bestDy) <= SNAP_THRESHOLD ? yLines : []),
    ],
  }
}
