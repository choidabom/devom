import type { SnapLine } from "../utils/snap"

interface SnapGuidesProps {
  lines: SnapLine[]
}

export function SnapGuides({ lines }: SnapGuidesProps) {
  if (lines.length === 0) return null

  return (
    <>
      {lines.map((line, i) => (
        <div
          key={`${line.axis}-${line.position}-${i}`}
          style={{
            position: "absolute",
            background: "#f43f5e",
            pointerEvents: "none",
            zIndex: 9999,
            ...(line.axis === "x"
              ? { left: line.position, top: line.from, width: 1, height: line.to - line.from }
              : { left: line.from, top: line.position, width: line.to - line.from, height: 1 }),
          }}
        />
      ))}
    </>
  )
}
