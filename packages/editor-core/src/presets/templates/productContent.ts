import type { DocumentStore } from "../../stores/DocumentStore"
import { createTemplateHelper } from "./helpers"

/**
 * 상품 상세 설명 콘텐츠 템플릿
 * 쿠팡/스마트스토어/카페24 등 상품정보 탭에 들어가는 내부 콘텐츠
 * Nav/Footer/Cart 등 플랫폼 제공 UI 제외, 순수 상품 설명만
 */
export function buildProductContent(store: DocumentStore): void {
  const root = store.elements.get(store.rootId)
  if (!root) return

  const rel = { position: 'relative' as const, left: undefined, top: undefined }
  const noPad = { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 }
  const add = createTemplateHelper(store)

  const t = '#222222'
  const s = '#555555'
  const m = '#999999'
  const bd = '#e8e8e8'
  const accent = '#2563eb'
  const bg = '#f7f7f7'
  const box = { backgroundColor: 'transparent' as const, borderRadius: 0, border: 'none' }

  // 상세페이지 표준 너비 (860px — 쿠팡/스마트스토어 기준)
  const W = 860
  const page = add('div', store.rootId, {
    name: 'Content',
    style: { left: 0, top: 0, width: W, height: 'auto', backgroundColor: '#ffffff', borderRadius: 0, border: 'none' },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 0, ...noPad, alignItems: 'stretch' },
  })
  if (!page) return

  // ════════════════════════════════════════════
  // 1. 키비주얼 배너
  // ════════════════════════════════════════════
  const keyVisual = add('div', page, {
    name: 'Key Visual',
    style: { ...rel, width: 'auto', height: 'auto', backgroundColor: '#f0f4ff', borderRadius: 0, border: 'none' },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 16, paddingTop: 60, paddingRight: 40, paddingBottom: 60, paddingLeft: 40, alignItems: 'center' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (keyVisual) {
    add('sc:badge', keyVisual, { name: 'KV Badge', style: { ...rel }, props: { label: '2026 NEW', variant: 'default' } })
    add('text', keyVisual, { name: 'KV Title', style: { ...rel, fontSize: 36, fontWeight: 800, color: t, textAlign: 'center', lineHeight: 1.3 }, props: { content: '프리미엄 무선 헤드폰\nANC-Pro 3세대' } })
    add('text', keyVisual, { name: 'KV Sub', style: { ...rel, fontSize: 16, color: s, textAlign: 'center', lineHeight: 1.6 }, props: { content: '노이즈캔슬링 · 40시간 배터리 · Hi-Res 오디오' } })
    // Hero image placeholder
    add('div', keyVisual, {
      name: 'KV Image',
      style: { ...rel, width: 700, height: 400, backgroundColor: '#e0e7ff', borderRadius: 16 },
      sizing: { w: 'fixed', h: 'fixed' },
    })
  }

  // ════════════════════════════════════════════
  // 2. 핵심 특장점
  // ════════════════════════════════════════════
  const uspSection = add('div', page, {
    name: 'USP Section',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 40, paddingTop: 60, paddingRight: 40, paddingBottom: 60, paddingLeft: 40, alignItems: 'center' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (uspSection) {
    add('text', uspSection, { name: 'USP Title', style: { ...rel, fontSize: 24, fontWeight: 700, color: t, textAlign: 'center' }, props: { content: '이 제품이 특별한 이유' } })

    // USP items — 좌우 교차 레이아웃
    const usps = [
      { title: '하이브리드 노이즈캔슬링', desc: '외부 마이크 4개가 주변 소음을 실시간 분석하여 99%까지 차단합니다. 비행기, 카페, 사무실 어디서든 나만의 조용한 공간을 만들어 보세요.', color: '#f0f4ff' },
      { title: '40시간 초장시간 재생', desc: 'ANC 켠 상태에서도 40시간 연속 재생. 10분 급속 충전으로 3시간 사용 가능해 배터리 걱정 없이 하루를 보낼 수 있습니다.', color: '#f0fdf4' },
      { title: 'Hi-Res 오디오 인증', desc: '40mm 베릴륨 드라이버와 LDAC 코덱으로 CD 수준을 뛰어넘는 고해상도 사운드를 무선으로 즐기세요.', color: '#fffbeb' },
    ]
    for (let i = 0; i < usps.length; i++) {
      const usp = usps[i]!
      const row = add('div', uspSection, {
        name: usp.title,
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex',
        layoutProps: { direction: 'row', gap: 32, ...noPad, alignItems: 'center' },
        sizing: { w: 'fill', h: 'hug' },
      })
      if (row) {
        // 이미지와 텍스트 순서를 교차
        if (i % 2 === 0) {
          add('div', row, {
            name: `${usp.title} Img`,
            style: { ...rel, width: 360, height: 240, backgroundColor: usp.color, borderRadius: 16 },
            sizing: { w: 'fixed', h: 'fixed' },
          })
        }
        const textCol = add('div', row, {
          name: `${usp.title} Text`,
          style: { ...rel, width: 'auto', height: 'auto', ...box },
          layoutMode: 'flex',
          layoutProps: { direction: 'column', gap: 12, ...noPad, alignItems: 'start' },
          sizing: { w: 'fill', h: 'hug' },
        })
        if (textCol) {
          add('text', textCol, { name: `${usp.title} T`, style: { ...rel, fontSize: 20, fontWeight: 700, color: t, lineHeight: 1.3 }, props: { content: usp.title } })
          add('text', textCol, { name: `${usp.title} D`, style: { ...rel, fontSize: 14, color: s, lineHeight: 1.7 }, props: { content: usp.desc } })
        }
        if (i % 2 !== 0) {
          add('div', row, {
            name: `${usp.title} Img`,
            style: { ...rel, width: 360, height: 240, backgroundColor: usp.color, borderRadius: 16 },
            sizing: { w: 'fixed', h: 'fixed' },
          })
        }
      }
    }
  }

  // ════════════════════════════════════════════
  // 3. 스펙 아이콘 그리드
  // ════════════════════════════════════════════
  const specGrid = add('div', page, {
    name: 'Spec Grid',
    style: { ...rel, width: 'auto', height: 'auto', backgroundColor: bg, borderRadius: 0, border: 'none' },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 24, paddingTop: 48, paddingRight: 40, paddingBottom: 48, paddingLeft: 40, alignItems: 'center' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (specGrid) {
    add('text', specGrid, { name: 'Spec Grid Title', style: { ...rel, fontSize: 22, fontWeight: 700, color: t, textAlign: 'center' }, props: { content: '한눈에 보는 주요 스펙' } })

    const grid = add('div', specGrid, {
      name: 'Grid',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex', layoutProps: { direction: 'row', gap: 12, ...noPad, alignItems: 'stretch' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (grid) {
      const specs = [
        { icon: '🔇', label: 'ANC', value: '99% 차단' },
        { icon: '🔋', label: '배터리', value: '40시간' },
        { icon: '⚡', label: '급속충전', value: '10분→3시간' },
        { icon: '🎵', label: '드라이버', value: '40mm Be' },
        { icon: '📡', label: 'BT', value: '5.3 멀티포인트' },
        { icon: '⚖️', label: '무게', value: '250g' },
      ]
      for (const sp of specs) {
        const card = add('div', grid, {
          name: sp.label,
          style: { ...rel, width: 'auto', height: 'auto', backgroundColor: '#ffffff', borderRadius: 12, border: `1px solid ${bd}` },
          layoutMode: 'flex',
          layoutProps: { direction: 'column', gap: 6, paddingTop: 20, paddingRight: 12, paddingBottom: 20, paddingLeft: 12, alignItems: 'center' },
          sizing: { w: 'fill', h: 'hug' },
        })
        if (card) {
          add('text', card, { name: `${sp.label} I`, style: { ...rel, fontSize: 24 }, props: { content: sp.icon } })
          add('text', card, { name: `${sp.label} L`, style: { ...rel, fontSize: 11, color: m, textAlign: 'center' }, props: { content: sp.label } })
          add('text', card, { name: `${sp.label} V`, style: { ...rel, fontSize: 13, fontWeight: 700, color: t, textAlign: 'center' }, props: { content: sp.value } })
        }
      }
    }
  }

  // ════════════════════════════════════════════
  // 4. 상세 이미지 (길게 스크롤)
  // ════════════════════════════════════════════
  const imgSection = add('div', page, {
    name: 'Detail Images',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 0, ...noPad, alignItems: 'center' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (imgSection) {
    // 상세페이지 이미지 영역 — 실제로는 디자인된 이미지가 들어감
    for (const [name, h, color] of [
      ['Detail Banner 1', 500, '#f8f9fa'],
      ['Detail Banner 2', 450, '#f0f4ff'],
      ['Detail Banner 3', 400, '#fafaf5'],
    ] as const) {
      add('div', imgSection, {
        name,
        style: { ...rel, width: W, height: h, backgroundColor: color, borderRadius: 0, border: 'none' },
        sizing: { w: 'fill', h: 'fixed' },
      })
    }
  }

  // ════════════════════════════════════════════
  // 5. 사용법 / 관리법
  // ════════════════════════════════════════════
  const howToSection = add('div', page, {
    name: 'How To',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 24, paddingTop: 48, paddingRight: 40, paddingBottom: 48, paddingLeft: 40, alignItems: 'center' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (howToSection) {
    add('text', howToSection, { name: 'HowTo Title', style: { ...rel, fontSize: 22, fontWeight: 700, color: t, textAlign: 'center' }, props: { content: '사용 방법' } })

    const steps = [
      { num: '01', title: '전원 켜기', desc: '전원 버튼을 2초간 길게 누르면 LED가 파란색으로 점등되며 전원이 켜집니다.' },
      { num: '02', title: '블루투스 연결', desc: '설정 > 블루투스에서 "ANC-Pro 3"을 선택하세요. 처음 연결 시 자동 페어링됩니다.' },
      { num: '03', title: 'ANC 모드 전환', desc: 'ANC 버튼을 터치하여 노이즈캔슬링 / 외부소리듣기 / OFF 3가지 모드를 전환합니다.' },
      { num: '04', title: '충전하기', desc: 'USB-C 케이블을 연결하면 LED가 빨간색으로 점등됩니다. 완충 시 초록색으로 변경됩니다.' },
    ]
    for (const step of steps) {
      const stepRow = add('div', howToSection, {
        name: `Step ${step.num}`,
        style: { ...rel, width: 'auto', height: 'auto', backgroundColor: bg, borderRadius: 12, border: 'none' },
        layoutMode: 'flex',
        layoutProps: { direction: 'row', gap: 20, paddingTop: 20, paddingRight: 24, paddingBottom: 20, paddingLeft: 24, alignItems: 'center' },
        sizing: { w: 'fill', h: 'hug' },
      })
      if (stepRow) {
        add('text', stepRow, { name: `${step.num} Num`, style: { ...rel, fontSize: 28, fontWeight: 800, color: accent, width: 50 }, props: { content: step.num } })
        const stepText = add('div', stepRow, {
          name: `${step.num} Text`,
          style: { ...rel, width: 'auto', height: 'auto', ...box },
          layoutMode: 'flex', layoutProps: { direction: 'column', gap: 4, ...noPad, alignItems: 'start' },
          sizing: { w: 'fill', h: 'hug' },
        })
        if (stepText) {
          add('text', stepText, { name: `${step.num} T`, style: { ...rel, fontSize: 15, fontWeight: 700, color: t }, props: { content: step.title } })
          add('text', stepText, { name: `${step.num} D`, style: { ...rel, fontSize: 13, color: s, lineHeight: 1.5 }, props: { content: step.desc } })
        }
      }
    }
  }

  // ════════════════════════════════════════════
  // 6. 상세 스펙 테이블
  // ════════════════════════════════════════════
  const specTable = add('div', page, {
    name: 'Spec Table Section',
    style: { ...rel, width: 'auto', height: 'auto', backgroundColor: bg, borderRadius: 0, border: 'none' },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 16, paddingTop: 48, paddingRight: 40, paddingBottom: 48, paddingLeft: 40, alignItems: 'stretch' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (specTable) {
    add('text', specTable, { name: 'Table Title', style: { ...rel, fontSize: 22, fontWeight: 700, color: t }, props: { content: '상세 스펙' } })
    add('sc:table', specTable, {
      name: 'Spec Table',
      style: { ...rel, width: undefined },
      props: {
        headers: ['항목', '상세'],
        rows: [
          ['제품명', 'ANC-Pro 3세대 무선 헤드폰'],
          ['모델번호', 'DVOM-ANC-P3'],
          ['드라이버', '40mm 베릴륨 다이나믹'],
          ['주파수 응답', '4Hz — 40kHz'],
          ['임피던스', '32Ω'],
          ['감도', '100dB/mW'],
          ['배터리 용량', '800mAh'],
          ['재생시간', 'ANC ON 40시간 / OFF 60시간'],
          ['충전', 'USB-C (10분 충전 = 3시간 재생)'],
          ['블루투스', '5.3 (멀티포인트, 2대 동시)'],
          ['지원 코덱', 'LDAC, aptX HD, AAC, SBC'],
          ['무게', '250g'],
          ['색상', '미드나이트 블랙 / 클라우드 화이트 / 네이비'],
          ['구성품', '헤드폰, USB-C 케이블, 3.5mm 케이블, 파우치, 설명서'],
        ],
      },
      sizing: { w: 'fill', h: 'hug' },
    })
  }

  // ════════════════════════════════════════════
  // 7. 인증 / 수상
  // ════════════════════════════════════════════
  const certSection = add('div', page, {
    name: 'Certifications',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 20, paddingTop: 48, paddingRight: 40, paddingBottom: 48, paddingLeft: 40, alignItems: 'center' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (certSection) {
    add('text', certSection, { name: 'Cert Title', style: { ...rel, fontSize: 22, fontWeight: 700, color: t, textAlign: 'center' }, props: { content: '인증 및 수상' } })
    const certGrid = add('div', certSection, {
      name: 'Cert Grid',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex', layoutProps: { direction: 'row', gap: 24, ...noPad, alignItems: 'center', justifyContent: 'center' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (certGrid) {
      const certs = [
        { icon: '🏆', label: 'CES 2026\nInnovation Award' },
        { icon: '🎖️', label: 'Hi-Res Audio\nCertified' },
        { icon: '✅', label: 'KC 인증\nR-R-DVM-ANC3' },
        { icon: '🌍', label: 'RoHS\nCompliant' },
      ]
      for (const c of certs) {
        const certCard = add('div', certGrid, {
          name: c.label.split('\n')[0]!,
          style: { ...rel, width: 'auto', height: 'auto', ...box },
          layoutMode: 'flex', layoutProps: { direction: 'column', gap: 8, ...noPad, alignItems: 'center' },
          sizing: { w: 'hug', h: 'hug' },
        })
        if (certCard) {
          add('div', certCard, {
            name: `${c.label.split('\n')[0]} Icon`,
            style: { ...rel, width: 64, height: 64, backgroundColor: bg, borderRadius: 32, border: `1px solid ${bd}`, display: 'flex' },
          })
          add('text', certCard, { name: `${c.label.split('\n')[0]} Emoji`, style: { ...rel, fontSize: 28 }, props: { content: c.icon } })
          add('text', certCard, { name: `${c.label.split('\n')[0]} L`, style: { ...rel, fontSize: 11, color: s, textAlign: 'center', lineHeight: 1.4 }, props: { content: c.label } })
        }
      }
    }
  }

  // ════════════════════════════════════════════
  // 8. 주의사항 / 안내
  // ════════════════════════════════════════════
  const noticeSection = add('div', page, {
    name: 'Notice',
    style: { ...rel, width: 'auto', height: 'auto', backgroundColor: bg, borderRadius: 0, border: 'none' },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 12, paddingTop: 40, paddingRight: 40, paddingBottom: 40, paddingLeft: 40, alignItems: 'stretch' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (noticeSection) {
    add('text', noticeSection, { name: 'Notice Title', style: { ...rel, fontSize: 16, fontWeight: 700, color: t }, props: { content: '안내사항' } })
    const notices = [
      '모니터 해상도에 따라 실제 색상과 다소 차이가 있을 수 있습니다.',
      '제품 개봉 후 초기 불량이 아닌 단순 변심에 의한 반품 시 왕복 택배비가 발생합니다.',
      '보증기간은 구매일로부터 2년이며, 사용자 과실로 인한 파손은 유상 수리됩니다.',
      '해당 이미지의 소품은 제품에 포함되지 않습니다.',
    ]
    for (const n of notices) {
      add('text', noticeSection, { name: n.slice(0, 8), style: { ...rel, fontSize: 12, color: m, lineHeight: 1.6 }, props: { content: `• ${n}` } })
    }
  }
}
