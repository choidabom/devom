"use client"

import { useState } from "react"
import { Select } from "@devom/components"

// 배열로 옵션 정의 - 재사용 가능하고 관리하기 쉬움
const FRAMEWORKS = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "angular", label: "Angular" },
] as const

const TECH_STACK = {
  프론트엔드: [
    { value: "react", label: "React" },
    { value: "vue", label: "Vue" },
    { value: "next", label: "Next.js" },
  ],
  백엔드: [
    { value: "node", label: "Node.js" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
  ],
  데이터베이스: [
    { value: "postgres", label: "PostgreSQL" },
    { value: "mysql", label: "MySQL" },
    { value: "mongo", label: "MongoDB" },
  ],
} as const

const PLANS = [
  { value: "free", label: "무료 플랜", disabled: false },
  { value: "pro", label: "Pro 플랜 (준비중)", disabled: true },
  { value: "enterprise", label: "Enterprise (문의)", disabled: true },
] as const

const THEMES = [
  { value: "light", label: "라이트 모드" },
  { value: "dark", label: "다크 모드" },
  { value: "system", label: "시스템 설정" },
] as const

export default function DemoPage() {
  const [framework, setFramework] = useState<string>()
  const [theme, setTheme] = useState<string>("light")

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="text-3xl font-bold">Select Component Demo</h1>

        {/* 기본 예시 - 배열 매핑 사용 */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">기본 사용 (배열 매핑)</h2>
          <div className="w-[280px]">
            <Select value={framework} onValueChange={setFramework}>
              <Select.Trigger>
                <Select.Value placeholder="프레임워크 선택" />
              </Select.Trigger>
              <Select.Content>
                {FRAMEWORKS.map((fw) => (
                  <Select.Item key={fw.value} value={fw.value}>
                    {fw.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">선택된 값: {framework ?? "없음"}</p>
        </section>

        {/* 그룹 예시 - 객체 매핑 사용 */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">그룹과 라벨 (객체 매핑)</h2>
          <div className="w-[280px]">
            <Select defaultValue="node">
              <Select.Trigger>
                <Select.Value placeholder="기술 스택 선택" />
              </Select.Trigger>
              <Select.Content>
                {Object.entries(TECH_STACK).map(([category, items], idx) => (
                  <div key={category}>
                    {idx > 0 && <Select.Separator />}
                    <Select.Group>
                      <Select.Label>{category}</Select.Label>
                      {items.map((item) => (
                        <Select.Item key={item.value} value={item.value}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Group>
                  </div>
                ))}
              </Select.Content>
            </Select>
          </div>
        </section>

        {/* Disabled 예시 - disabled 속성 배열에 포함 */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">비활성화 상태</h2>
          <div className="flex gap-4">
            <div className="w-[200px]">
              <p className="mb-2 text-sm font-medium">전체 비활성화</p>
              <Select disabled>
                <Select.Trigger>
                  <Select.Value placeholder="선택 불가" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="a">옵션 A</Select.Item>
                </Select.Content>
              </Select>
            </div>
            <div className="w-[200px]">
              <p className="mb-2 text-sm font-medium">일부 옵션 비활성화</p>
              <Select>
                <Select.Trigger>
                  <Select.Value placeholder="선택하세요" />
                </Select.Trigger>
                <Select.Content>
                  {PLANS.map((plan) => (
                    <Select.Item key={plan.value} value={plan.value} disabled={plan.disabled}>
                      {plan.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          </div>
        </section>

        {/* 테마 선택 예시 */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">실제 활용 예시</h2>
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">테마 설정</p>
                <p className="text-sm text-muted-foreground">앱의 테마를 선택하세요</p>
              </div>
              <div className="w-[180px]">
                <Select value={theme} onValueChange={setTheme}>
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    {THEMES.map((theme) => (
                      <Select.Item key={theme.value} value={theme.value}>
                        {theme.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
