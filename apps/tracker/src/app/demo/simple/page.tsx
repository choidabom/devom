"use client"

import { useState } from "react"
import { FlatSelect, type SelectOption, type SelectGroup } from "@devom/components"

// 단순 옵션 배열
const FRAMEWORKS: SelectOption[] = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "angular", label: "Angular" },
]

// 그룹화된 옵션
const TECH_GROUPS: SelectGroup[] = [
  {
    label: "프론트엔드",
    options: [
      { value: "react", label: "React" },
      { value: "vue", label: "Vue" },
      { value: "next", label: "Next.js" },
    ],
  },
  {
    label: "백엔드",
    options: [
      { value: "node", label: "Node.js" },
      { value: "go", label: "Go" },
      { value: "rust", label: "Rust" },
    ],
  },
  {
    label: "데이터베이스",
    options: [
      { value: "postgres", label: "PostgreSQL" },
      { value: "mysql", label: "MySQL" },
      { value: "mongo", label: "MongoDB" },
    ],
  },
]

// disabled 옵션 포함
const PLANS: SelectOption[] = [
  { value: "free", label: "무료 플랜" },
  { value: "pro", label: "Pro 플랜 (준비중)", disabled: true },
  { value: "enterprise", label: "Enterprise (문의)", disabled: true },
]

const THEMES: SelectOption[] = [
  { value: "light", label: "라이트 모드" },
  { value: "dark", label: "다크 모드" },
  { value: "system", label: "시스템 설정" },
]

export default function FlatSelectDemoPage() {
  const [framework, setFramework] = useState<string>()
  const [theme, setTheme] = useState<string>("light")

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">FlatSelect Demo</h1>
          <p className="mt-2 text-muted-foreground">Props 기반 Flat 패턴 - Compound Component보다 간결한 API</p>
        </div>

        {/* 기본 사용 */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">기본 사용</h2>
          <div className="w-[280px]">
            <FlatSelect value={framework} onValueChange={setFramework} placeholder="프레임워크 선택" options={FRAMEWORKS} />
          </div>
          <p className="text-sm text-muted-foreground">선택된 값: {framework ?? "없음"}</p>
          <pre className="rounded bg-muted p-4 text-sm overflow-x-auto">
            {`<FlatSelect
  value={framework}
  onValueChange={setFramework}
  placeholder="프레임워크 선택"
  options={FRAMEWORKS}
/>`}
          </pre>
        </section>

        {/* 그룹 사용 */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">그룹 사용</h2>
          <div className="w-[280px]">
            <FlatSelect defaultValue="node" placeholder="기술 스택 선택" groups={TECH_GROUPS} />
          </div>
          <pre className="rounded bg-muted p-4 text-sm overflow-x-auto">
            {`<FlatSelect
  defaultValue="node"
  placeholder="기술 스택 선택"
  groups={TECH_GROUPS}
/>`}
          </pre>
        </section>

        {/* 비활성화 */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">비활성화 상태</h2>
          <div className="flex gap-4">
            <div className="w-[200px]">
              <p className="mb-2 text-sm font-medium">전체 비활성화</p>
              <FlatSelect disabled placeholder="선택 불가" options={FRAMEWORKS} />
            </div>
            <div className="w-[200px]">
              <p className="mb-2 text-sm font-medium">일부 옵션 비활성화</p>
              <FlatSelect placeholder="플랜 선택" options={PLANS} />
            </div>
          </div>
        </section>

        {/* 실제 활용 */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">실제 활용 예시</h2>
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">테마 설정</p>
                <p className="text-sm text-muted-foreground">앱의 테마를 선택하세요</p>
              </div>
              <div className="w-[180px]">
                <FlatSelect value={theme} onValueChange={setTheme} options={THEMES} />
              </div>
            </div>
          </div>
        </section>

        {/* 비교 */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Compound vs Flat 비교</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Compound Component</h3>
              <pre className="rounded bg-muted p-3 text-xs overflow-x-auto">
                {`<Select value={v} onValueChange={setV}>
  <Select.Trigger>
    <Select.Value placeholder="..." />
  </Select.Trigger>
  <Select.Content>
    <Select.Group>
      <Select.Label>그룹</Select.Label>
      <Select.Item value="a">A</Select.Item>
    </Select.Group>
  </Select.Content>
</Select>`}
              </pre>
              <p className="mt-2 text-xs text-muted-foreground">
                ✓ 유연한 커스터마이징
                <br />
                ✓ 복잡한 레이아웃 가능
                <br />✗ 보일러플레이트 많음
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Flat (Props 기반)</h3>
              <pre className="rounded bg-muted p-3 text-xs overflow-x-auto">
                {`<FlatSelect
  value={v}
  onValueChange={setV}
  placeholder="..."
  groups={[{
    label: "그룹",
    options: [{ value: "a", label: "A" }]
  }]}
/>`}
              </pre>
              <p className="mt-2 text-xs text-muted-foreground">
                ✓ 간결한 API
                <br />
                ✓ 타입 안전성
                <br />✗ 커스터마이징 제한
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
