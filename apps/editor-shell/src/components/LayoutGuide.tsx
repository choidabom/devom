import { useEffect, useState } from "react"

interface Rect { left: number; top: number; width: number; height: number }

const REGIONS = [
  {
    id: "toolbar",
    label: "Toolbar",
    color: "59, 130, 246",
    lines: [
      "버튼 클릭 → DocumentStore.addElement() → Canvas에 ADD_ELEMENT 전송 → 즉시 렌더링",
      "Export 시 toSerializable()로 트리 직렬화 → JSON/JSX/HTML 코드 생성",
    ],
    tech: "Toolbar.tsx | HistoryStore",
    keys: "Del 삭제 · Cmd+Z Undo · Cmd+Shift+Z Redo",
  },
  {
    id: "layers",
    label: "Layers Panel",
    color: "34, 197, 94",
    lines: [
      "DocumentStore.rootId부터 children[]을 재귀 순회하며 트리 UI 구성",
      "요소 클릭 → selectionStore.select() + Canvas에 SELECT_ELEMENT 전송 → 양쪽 동기화",
      "MobX observer: 요소 추가/삭제 시 트리가 자동으로 리렌더링",
      "depth 값으로 paddingLeft 계산 → 시각적 들여쓰기 표현",
    ],
    tech: "LeftPanel.tsx | LayerTree 재귀 컴포넌트 | MobX observer",
  },
  {
    id: "canvas",
    label: "Canvas (iframe :4001)",
    color: "139, 92, 246",
    lines: [
      "별도 Vite 앱 — Shell과 격리된 환경에서 실제 React 컴포넌트 렌더링",
      "iframe 로드 → CANVAS_READY → Shell이 SYNC_DOCUMENT로 전체 상태 전송",
      "요소 클릭 → getBoundingClientRect로 bounds 계산 → Shell에 ELEMENT_CLICKED 전송",
      "드래그: pointerdown → setPointerCapture → transform 실시간 이동 → pointerup 시 최종 좌표 전송",
      "다중 드래그: 선택 그룹 전체 DOM transform 동시 이동 → ELEMENTS_MOVED 배치 전송",
      "Marquee: 배경 드래그 시 영역 내 요소 자동 다중 선택",
      "리사이즈: SelectionOverlay가 DOM 측정으로 8방향 핸들 배치 → 드래그로 크기 변경",
    ],
    tech: "editor-canvas Vite app | ElementRenderer 재귀 | SelectionOverlay DOM 측정",
    flow: "Shell→Canvas: SYNC_DOCUMENT, ADD_ELEMENT, SELECT_ELEMENT(ids[])\nCanvas→Shell: ELEMENT_CLICKED(shiftKey), ELEMENTS_MOVED, MARQUEE_SELECT",
  },
  {
    id: "properties",
    label: "Properties Panel",
    color: "249, 115, 22",
    lines: [
      "selectionStore.selectedElements를 MobX observer로 구독 → 다중 선택 지원",
      "다중 선택 시 공통값 표시, 값이 다르면 'mixed' placeholder로 표시",
      "스타일 변경 시 선택된 모든 요소에 일괄 적용 (historyStore 스냅샷 1회)",
      "sc: 접두사 요소는 variant/size를 select 드롭다운으로 편집",
      "모든 변경 → toSerializable() → SYNC_DOCUMENT로 Canvas 전체 동기화",
    ],
    tech: "PropertiesPanel.tsx | MobX observer | SYNC_DOCUMENT 전체 동기화",
  },
] as const

export function LayoutGuide() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"regions" | "arch">("regions")
  const [rects, setRects] = useState<Record<string, Rect>>({})
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const measure = () => {
      const next: Record<string, Rect> = {}
      for (const r of REGIONS) {
        const el = document.querySelector(`[data-guide="${r.id}"]`) as HTMLElement | null
        if (el) {
          const b = el.getBoundingClientRect()
          next[r.id] = { left: b.left, top: b.top, width: b.width, height: b.height }
        }
      }
      setRects(next)
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [open])

  useEffect(() => {
    if (open && tab === "regions") setSelectedRegion("canvas")
  }, [open, tab])

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed", bottom: 16, right: 296, zIndex: 9999,
          width: 32, height: 32, borderRadius: 8, border: "none",
          background: open ? "#6366f1" : "rgba(0,0,0,0.5)",
          color: "#fff", fontSize: 14, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)", transition: "all 0.2s",
        }}
        title="Layout Guide"
      >
        {open ? "✕" : "?"}
      </button>

      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9998,
            background: "rgba(10,10,15,0.5)", backdropFilter: "blur(2px)",
          }}
          onClick={() => setOpen(false)}
        >
          {/* Tabs */}
          <div
            style={{
              position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
              display: "flex", gap: 2, background: "rgba(0,0,0,0.75)",
              borderRadius: 10, padding: 3, zIndex: 10, backdropFilter: "blur(12px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <TBtn active={tab === "regions"} onClick={() => setTab("regions")}>UI Regions</TBtn>
            <TBtn active={tab === "arch"} onClick={() => setTab("arch")}>Architecture</TBtn>
          </div>

          {tab === "regions" ? (
            <RegionsView rects={rects} selectedRegion={selectedRegion} onSelectRegion={setSelectedRegion} />
          ) : (
            <ArchView />
          )}
        </div>
      )}

      <style>{`
        @keyframes gi { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ci { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </>
  )
}

function TBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 16px", border: "none", borderRadius: 8, cursor: "pointer",
      fontSize: 12, fontWeight: 600, transition: "all 0.15s",
      background: active ? "#fff" : "transparent",
      color: active ? "#1e1e2e" : "rgba(255,255,255,0.5)",
    }}>{children}</button>
  )
}

// --- Regions: label badges on each region + detail panel at bottom ---

function RegionsView({ rects, selectedRegion, onSelectRegion }: {
  rects: Record<string, Rect>
  selectedRegion: string | null
  onSelectRegion: (id: string) => void
}) {
  const selected = REGIONS.find(r => r.id === selectedRegion)

  return (
    <>
      {/* Region overlays — just colored borders + clickable label badges */}
      {REGIONS.map((r, i) => {
        const rect = rects[r.id]
        if (!rect) return null
        const isActive = selectedRegion === r.id

        return (
          <div
            key={r.id}
            onClick={(e) => { e.stopPropagation(); onSelectRegion(r.id) }}
            style={{
              position: "absolute",
              left: rect.left, top: rect.top, width: rect.width, height: rect.height,
              background: isActive ? `rgba(${r.color}, 0.12)` : `rgba(${r.color}, 0.04)`,
              border: `2px solid rgba(${r.color}, ${isActive ? 0.8 : 0.3})`,
              borderRadius: 6,
              cursor: "pointer",
              transition: "all 0.15s",
              animation: `ci 0.25s ease-out ${i * 0.05}s both`,
            }}
          >
            {/* Label badge */}
            <div style={{
              position: "absolute", top: 8, left: 8,
              background: `rgba(${r.color}, ${isActive ? 1 : 0.7})`, color: "#fff",
              padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)", whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}>
              {r.label}
            </div>
          </div>
        )
      })}

      {/* Detail panel — fixed at bottom center */}
      {selected && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            bottom: 56, left: "50%", transform: "translateX(-50%)",
            width: "min(680px, calc(100vw - 64px))",
            background: "rgba(20,20,28,0.96)",
            border: `1px solid rgba(${selected.color}, 0.3)`,
            borderRadius: 14,
            padding: "16px 20px",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            animation: "ci 0.2s ease-out",
            zIndex: 5,
            maxHeight: "40vh",
            overflowY: "auto",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              background: `rgba(${selected.color}, 0.9)`, color: "#fff",
              padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700,
            }}>
              {selected.label}
            </div>
            <span style={{
              fontSize: 11, fontFamily: "'SF Mono', Menlo, monospace",
              color: "rgba(255,255,255,0.4)",
            }}>
              {selected.tech}
            </span>
          </div>

          {/* Description bullets */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {selected.lines.map((line, li) => (
              <div key={li} style={{
                fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.6,
                paddingLeft: 12, position: "relative",
              }}>
                <span style={{
                  position: "absolute", left: 0, top: 7,
                  width: 4, height: 4, borderRadius: "50%",
                  background: `rgba(${selected.color}, 0.6)`,
                }} />
                {line}
              </div>
            ))}
          </div>

          {/* Keys (toolbar only) */}
          {"keys" in selected && selected.keys && (
            <div style={{
              marginTop: 10, paddingTop: 8,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              fontSize: 11, fontFamily: "'SF Mono', Menlo, monospace",
              color: "rgba(255,255,255,0.5)",
            }}>
              {selected.keys}
            </div>
          )}

          {/* Data flow (canvas only) */}
          {"flow" in selected && selected.flow && (
            <div style={{
              marginTop: 8, paddingTop: 8,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              fontSize: 11, fontFamily: "'SF Mono', Menlo, monospace",
              color: "rgba(255,255,255,0.4)", lineHeight: 1.6,
              whiteSpace: "pre-line",
            }}>
              {selected.flow}
            </div>
          )}
        </div>
      )}
    </>
  )
}

// --- Architecture View ---

function ArchView() {
  const cards = [
    {
      label: "SHELL", title: "editor-shell (:4000)", color: "59, 130, 246",
      sections: [
        { h: "Stores (MobX)", items: [
          "DocumentStore — observable.map<id, EditorElement>로 요소 트리 관리",
          "SelectionStore — selectedIds[] 배열로 다중 선택 지원, toggle/setIds 메서드",
          "HistoryStore — JSON 스냅샷 스택으로 Undo/Redo 구현",
          "모든 Store는 makeAutoObservable → observer 컴포넌트 자동 리렌더",
        ]},
        { h: "역할", items: [
          "상태의 단일 소스 (Single Source of Truth)",
          "사용자 입력 처리 → Store 업데이트 → Canvas 동기화",
          "iframe 로드 시 SYNC_DOCUMENT로 초기 상태 전송",
        ]},
      ],
    },
    {
      label: "BRIDGE", title: "MessageBridge (postMessage)", color: "236, 72, 153",
      sections: [
        { h: "왜 postMessage?", items: [
          "iframe은 별도 window → 직접 함수 호출이나 상태 공유 불가",
          "MobX observable은 iframe 경계를 넘으면 반응성이 깨짐",
          "postMessage + JSON 직렬화로 안전하게 데이터 전달",
        ]},
        { h: "동기화 전략", items: [
          "개별 UPDATE 대신 전체 SYNC_DOCUMENT 사용",
          "Object.assign은 MobX 추적 불가 → loadFromSerializable()로 Map 재구축",
          "toSerializable()로 MobX proxy 제거 (JSON.parse/stringify)",
        ]},
        { h: "메시지 흐름", items: [
          "Shell→Canvas: SYNC_DOCUMENT, ADD_ELEMENT, SELECT_ELEMENT(ids[])",
          "Canvas→Shell: ELEMENT_CLICKED(shiftKey), ELEMENTS_MOVED, MARQUEE_SELECT",
        ]},
      ],
    },
    {
      label: "CANVAS", title: "editor-canvas (:4001)", color: "139, 92, 246",
      sections: [
        { h: "왜 별도 앱?", items: [
          "실제 React 컴포넌트를 격리 환경에서 렌더링",
          "shadcn/ui + Tailwind CSS가 에디터 UI와 충돌 방지",
          "디자인한 컴포넌트를 그대로 코드로 추출 가능",
        ]},
        { h: "렌더링 파이프라인", items: [
          "SYNC_DOCUMENT 수신 → loadFromSerializable()로 Store 재구축",
          "ElementRenderer가 rootId부터 재귀 순회하며 DOM 생성",
          "getElementContent()가 타입별 실제 컴포넌트(Button, Card...) 매핑",
        ]},
        { h: "인터랙션", items: [
          "드래그: setPointerCapture → transform 실시간 이동 → 최종 좌표 Shell 전송",
          "다중 드래그: 선택 그룹 전체 DOM transform 동시 이동 → ELEMENTS_MOVED 배치 전송",
          "Marquee: 배경 드래그 → 영역 내 요소 자동 다중 선택 (MARQUEE_SELECT)",
          "리사이즈: getBoundingClientRect로 실제 DOM 크기 측정 → 8방향 핸들",
          "Shift+Click: 기존 선택에 토글 추가/제거",
        ]},
      ],
    },
  ]

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "32px 32px 70px", gap: 20,
      }}
    >
      {cards.map((card, ci) => (
        <div key={card.title} style={{
          flex: 1, maxWidth: 320,
          background: "rgba(20,20,28,0.96)", border: `1px solid rgba(${card.color}, 0.25)`,
          borderRadius: 16, padding: "20px 18px",
          backdropFilter: "blur(16px)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          animation: `ci 0.3s ease-out ${ci * 0.08}s both`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: `rgba(${card.color}, 0.6)`, marginBottom: 4 }}>{card.label}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16, fontFamily: "'SF Mono', Menlo, monospace" }}>{card.title}</div>

          {card.sections.map((s, si) => (
            <div key={si} style={{ marginBottom: si < card.sections.length - 1 ? 12 : 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 5, paddingBottom: 3, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{s.h}</div>
              {s.items.map((item, ii) => (
                <div key={ii} style={{
                  fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.6,
                  paddingLeft: 12, position: "relative", marginBottom: 2,
                }}>
                  <span style={{ position: "absolute", left: 0, top: 7, width: 4, height: 4, borderRadius: "50%", background: `rgba(${card.color}, 0.4)` }} />
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
