import type { DocumentStore } from "../../stores/DocumentStore"
import { createTemplateHelper } from "./helpers"

export function buildLandingPage(store: DocumentStore): void {
  const root = store.elements.get(store.rootId)
  if (!root) return

  const rel = { position: 'relative' as const, left: undefined, top: undefined }
  const noPad = { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 }
  const add = createTemplateHelper(store)

  // Color palette — Korean e-commerce style
  const t = '#1a1a1a'   // text
  const s = '#666666'   // secondary
  const m = '#999999'   // muted
  const bd = '#e5e5e5'  // border
  const red = '#ff0000' // sale price
  const bg = '#f5f5f5'  // light bg
  const box = { backgroundColor: 'transparent' as const, borderRadius: 0, border: 'none' }

  // ════════════════════════════════════════════
  // Page Wrapper (800px)
  // ════════════════════════════════════════════
  const W = 800
  const page = add('div', store.rootId, {
    name: 'Page',
    style: { left: 0, top: 0, width: W, height: 'auto', backgroundColor: '#ffffff', borderRadius: 0, border: 'none' },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 0, ...noPad, alignItems: 'stretch' },
  })
  if (!page) return

  // ════════════════════════════════════════════
  // Top Bar (배송 안내)
  // ════════════════════════════════════════════
  const topBar = add('div', page, {
    name: 'Top Bar',
    style: { ...rel, width: 'auto', height: 'auto', backgroundColor: t, borderRadius: 0, border: 'none' },
    layoutMode: 'flex',
    layoutProps: { direction: 'row', gap: 0, paddingTop: 8, paddingRight: 24, paddingBottom: 8, paddingLeft: 24, alignItems: 'center', justifyContent: 'center' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (topBar) {
    add('text', topBar, { name: 'Top Notice', style: { ...rel, fontSize: 12, fontWeight: 500, color: '#ffffff' }, props: { content: '🚀 오늘 주문 시 내일 도착 | 3만원 이상 무료배송' } })
  }

  // ════════════════════════════════════════════
  // Navigation
  // ════════════════════════════════════════════
  const nav = add('div', page, {
    name: 'Nav',
    style: { ...rel, width: 'auto', height: 'auto', ...box, borderBottom: `1px solid ${bd}` },
    layoutMode: 'flex',
    layoutProps: { direction: 'row', gap: 24, paddingTop: 14, paddingRight: 24, paddingBottom: 14, paddingLeft: 24, alignItems: 'center', justifyContent: 'space-between' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (nav) {
    add('text', nav, { name: 'Logo', style: { ...rel, fontSize: 20, fontWeight: 800, color: t }, props: { content: 'DEVOM STORE' } })
    const navLinks = add('div', nav, {
      name: 'Nav Links',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex', layoutProps: { direction: 'row', gap: 20, ...noPad, alignItems: 'center' },
      sizing: { w: 'hug', h: 'hug' },
    })
    if (navLinks) {
      for (const link of ['홈', '베스트', '신상품', '이벤트']) {
        add('text', navLinks, { name: link, style: { ...rel, fontSize: 14, fontWeight: 500, color: s }, props: { content: link } })
      }
    }
    const navRight = add('div', nav, {
      name: 'Nav Right',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex', layoutProps: { direction: 'row', gap: 16, ...noPad, alignItems: 'center' },
      sizing: { w: 'hug', h: 'hug' },
    })
    if (navRight) {
      add('sc:input', navRight, { name: 'Search', style: { ...rel, width: 180 }, props: { placeholder: '검색어를 입력하세요', type: 'search' } })
      add('sc:button', navRight, { name: 'Cart Button', style: { ...rel }, props: { label: '장바구니 (2)', variant: 'outline', size: 'sm' } })
    }
  }

  // ════════════════════════════════════════════
  // Breadcrumb
  // ════════════════════════════════════════════
  const breadcrumb = add('div', page, {
    name: 'Breadcrumb',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'row', gap: 8, paddingTop: 12, paddingRight: 24, paddingBottom: 12, paddingLeft: 24, alignItems: 'center' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (breadcrumb) {
    add('text', breadcrumb, { name: 'BC', style: { ...rel, fontSize: 12, color: m }, props: { content: '홈 > 가전/디지털 > 음향기기 > 헤드폰' } })
  }

  // ════════════════════════════════════════════
  // Hero Section — Product Image + Info (쇼핑몰 스타일)
  // ════════════════════════════════════════════
  const hero = add('div', page, {
    name: 'Hero Section',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'row', gap: 32, paddingTop: 24, paddingRight: 24, paddingBottom: 32, paddingLeft: 24, alignItems: 'start' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (hero) {
    // Left: Product images
    const imgCol = add('div', hero, {
      name: 'Image Column',
      style: { ...rel, width: 380, height: 'auto', ...box },
      layoutMode: 'flex',
      layoutProps: { direction: 'column', gap: 12, ...noPad, alignItems: 'stretch' },
      sizing: { w: 'fixed', h: 'hug' },
    })
    if (imgCol) {
      add('div', imgCol, {
        name: 'Main Image',
        style: { ...rel, width: 380, height: 380, backgroundColor: '#f8f8f8', borderRadius: 8, border: `1px solid ${bd}` },
        sizing: { w: 'fill', h: 'fixed' },
      })
      const thumbRow = add('div', imgCol, {
        name: 'Thumbnails',
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex', layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'center' },
        sizing: { w: 'fill', h: 'hug' },
      })
      if (thumbRow) {
        for (let i = 1; i <= 4; i++) {
          add('div', thumbRow, {
            name: `Thumb ${i}`,
            style: { ...rel, width: 72, height: 72, backgroundColor: '#f0f0f0', borderRadius: 4, border: i === 1 ? '2px solid #1a1a1a' : `1px solid ${bd}` },
            sizing: { w: 'fixed', h: 'fixed' },
          })
        }
      }
    }

    // Right: Product info
    const info = add('div', hero, {
      name: 'Product Info',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex',
      layoutProps: { direction: 'column', gap: 12, ...noPad, alignItems: 'start' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (info) {
      // Brand & Title
      add('text', info, { name: 'Brand', style: { ...rel, fontSize: 13, fontWeight: 500, color: m }, props: { content: 'DEVOM AUDIO' } })
      add('text', info, { name: 'Product Title', style: { ...rel, fontSize: 22, fontWeight: 700, color: t, lineHeight: 1.4 }, props: { content: '프리미엄 노이즈캔슬링 무선 헤드폰 ANC-Pro 3세대' } })

      // Rating
      const ratingRow = add('div', info, {
        name: 'Rating Row',
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex', layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'center' },
        sizing: { w: 'hug', h: 'hug' },
      })
      if (ratingRow) {
        add('text', ratingRow, { name: 'Stars', style: { ...rel, fontSize: 14, color: '#f59e0b' }, props: { content: '★★★★★' } })
        add('text', ratingRow, { name: 'Review Count', style: { ...rel, fontSize: 13, color: '#3b82f6', textDecoration: 'underline' }, props: { content: '4,287개 리뷰' } })
      }

      add('sc:separator', info, { name: 'Divider1', style: { ...rel, width: undefined }, sizing: { w: 'fill', h: 'fixed' } })

      // Price section (한국식 할인율 표시)
      const priceSection = add('div', info, {
        name: 'Price Section',
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex', layoutProps: { direction: 'column', gap: 4, ...noPad, alignItems: 'start' },
        sizing: { w: 'fill', h: 'hug' },
      })
      if (priceSection) {
        const origRow = add('div', priceSection, {
          name: 'Original Price Row',
          style: { ...rel, width: 'auto', height: 'auto', ...box },
          layoutMode: 'flex', layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'center' },
          sizing: { w: 'hug', h: 'hug' },
        })
        if (origRow) {
          add('text', origRow, { name: 'Orig Label', style: { ...rel, fontSize: 13, color: m }, props: { content: '정가' } })
          add('text', origRow, { name: 'Orig Price', style: { ...rel, fontSize: 14, color: m, textDecoration: 'line-through' }, props: { content: '398,000원' } })
        }
        const saleRow = add('div', priceSection, {
          name: 'Sale Price Row',
          style: { ...rel, width: 'auto', height: 'auto', ...box },
          layoutMode: 'flex', layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'end' },
          sizing: { w: 'hug', h: 'hug' },
        })
        if (saleRow) {
          add('text', saleRow, { name: 'Discount Rate', style: { ...rel, fontSize: 28, fontWeight: 800, color: red }, props: { content: '25%' } })
          add('text', saleRow, { name: 'Sale Price', style: { ...rel, fontSize: 28, fontWeight: 800, color: t }, props: { content: '298,000원' } })
        }
        const benefitRow = add('div', priceSection, {
          name: 'Benefit',
          style: { ...rel, width: 'auto', height: 'auto', ...box },
          layoutMode: 'flex', layoutProps: { direction: 'row', gap: 4, ...noPad, alignItems: 'center' },
          sizing: { w: 'hug', h: 'hug' },
        })
        if (benefitRow) {
          add('sc:badge', benefitRow, { name: 'Point Badge', style: { ...rel }, props: { label: '적립', variant: 'outline' } })
          add('text', benefitRow, { name: 'Point Text', style: { ...rel, fontSize: 12, color: s }, props: { content: '최대 14,900P 적립 (5%)' } })
        }
      }

      add('sc:separator', info, { name: 'Divider2', style: { ...rel, width: undefined }, sizing: { w: 'fill', h: 'fixed' } })

      // Delivery info (배송 정보)
      const deliveryInfo = add('div', info, {
        name: 'Delivery Info',
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex', layoutProps: { direction: 'column', gap: 8, ...noPad, alignItems: 'start' },
        sizing: { w: 'fill', h: 'hug' },
      })
      if (deliveryInfo) {
        const rows = [
          ['배송', '무료배송 (제주/도서산간 3,000원)'],
          ['도착', '내일(수) 오전 도착 예정'],
          ['혜택', '첫 구매 시 5,000원 할인 쿠폰'],
        ]
        for (const [label, value] of rows) {
          const dr = add('div', deliveryInfo, {
            name: `Del ${label}`,
            style: { ...rel, width: 'auto', height: 'auto', ...box },
            layoutMode: 'flex', layoutProps: { direction: 'row', gap: 12, ...noPad, alignItems: 'center' },
            sizing: { w: 'fill', h: 'hug' },
          })
          if (dr) {
            add('text', dr, { name: `${label} Label`, style: { ...rel, fontSize: 13, fontWeight: 600, color: s, width: 40 }, props: { content: label } })
            add('text', dr, { name: `${label} Value`, style: { ...rel, fontSize: 13, color: t }, props: { content: value } })
          }
        }
      }

      add('sc:separator', info, { name: 'Divider3', style: { ...rel, width: undefined }, sizing: { w: 'fill', h: 'fixed' } })

      // Color selection
      add('text', info, { name: 'Color Label', style: { ...rel, fontSize: 13, fontWeight: 600, color: t }, props: { content: '색상 선택' } })
      const colors = add('div', info, {
        name: 'Color Options',
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex', layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'center' },
        sizing: { w: 'hug', h: 'hug' },
      })
      if (colors) {
        for (const [c, label] of [['#1a1a1a', '미드나이트 블랙'], ['#f5f5f5', '클라우드 화이트'], ['#1e3a5f', '네이비']] as const) {
          const colorChip = add('div', colors, {
            name: label,
            style: { ...rel, width: 'auto', height: 'auto', ...box },
            layoutMode: 'flex', layoutProps: { direction: 'column', gap: 4, ...noPad, alignItems: 'center' },
            sizing: { w: 'hug', h: 'hug' },
          })
          if (colorChip) {
            add('div', colorChip, {
              name: `${label} Swatch`,
              style: { ...rel, width: 36, height: 36, backgroundColor: c, borderRadius: 18, border: c === '#1a1a1a' ? '3px solid #3b82f6' : `1px solid ${bd}` },
            })
            add('text', colorChip, { name: `${label} Name`, style: { ...rel, fontSize: 10, color: s }, props: { content: label } })
          }
        }
      }

      // CTA buttons
      const cta = add('div', info, {
        name: 'CTA Buttons',
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex', layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'center' },
        sizing: { w: 'fill', h: 'hug' },
      })
      if (cta) {
        add('sc:button', cta, { name: 'Buy Now', style: { ...rel }, props: { label: '바로 구매', variant: 'default', size: 'lg' } })
        add('sc:button', cta, { name: 'Add to Cart', style: { ...rel }, props: { label: '장바구니', variant: 'outline', size: 'lg' } })
        add('sc:button', cta, { name: 'Wishlist', style: { ...rel }, props: { label: '♡', variant: 'outline', size: 'lg' } })
      }
    }
  }

  // ════════════════════════════════════════════
  // Tab Navigation (상품정보/리뷰/문의/배송안내)
  // ════════════════════════════════════════════
  const tabNav = add('div', page, {
    name: 'Tab Navigation',
    style: { ...rel, width: 'auto', height: 'auto', backgroundColor: '#ffffff', borderRadius: 0, borderTop: `2px solid ${t}`, borderBottom: `1px solid ${bd}` },
    layoutMode: 'flex',
    layoutProps: { direction: 'row', gap: 0, ...noPad, alignItems: 'stretch' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (tabNav) {
    const tabs = ['상품정보', '리뷰 (4,287)', '상품문의 (156)', '배송/교환/반품']
    for (let i = 0; i < tabs.length; i++) {
      add('text', tabNav, {
        name: tabs[i]!,
        style: {
          ...rel, fontSize: 14, fontWeight: i === 0 ? 700 : 400,
          color: i === 0 ? t : s,
          padding: '14px 0',
          textAlign: 'center',
          borderBottom: i === 0 ? `2px solid ${t}` : 'none',
          width: 'auto',
        },
        props: { content: tabs[i]! },
        sizing: { w: 'fill', h: 'hug' },
      })
    }
  }

  // ════════════════════════════════════════════
  // 상품 상세 정보 Section
  // ════════════════════════════════════════════
  const detailSection = add('div', page, {
    name: 'Detail Section',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 32, paddingTop: 40, paddingRight: 24, paddingBottom: 40, paddingLeft: 24, alignItems: 'center' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (detailSection) {
    // Key features banner
    add('text', detailSection, { name: 'Detail Title', style: { ...rel, fontSize: 28, fontWeight: 700, color: t, textAlign: 'center', lineHeight: 1.4 }, props: { content: '당신의 일상에 조용한 혁신을\n가져다 줄 헤드폰' } })
    add('text', detailSection, { name: 'Detail Subtitle', style: { ...rel, fontSize: 15, color: s, textAlign: 'center', lineHeight: 1.6 }, props: { content: '프리미엄 ANC 기술과 40시간 배터리로\n어디서든 최고의 사운드를 경험하세요.' } })

    // Detail image placeholder
    add('div', detailSection, {
      name: 'Detail Hero Image',
      style: { ...rel, width: 600, height: 340, backgroundColor: '#f0f0f0', borderRadius: 12 },
      sizing: { w: 'fixed', h: 'fixed' },
    })

    // Feature grid
    const featGrid = add('div', detailSection, {
      name: 'Features Grid',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex', layoutProps: { direction: 'row', gap: 16, ...noPad, alignItems: 'stretch' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (featGrid) {
      const features = [
        { icon: '🔇', title: '노이즈 캔슬링', desc: '주변 소음을 99% 차단하는\n하이브리드 ANC 기술' },
        { icon: '🔋', title: '40시간 재생', desc: '하루 종일 사용 가능\n10분 충전으로 3시간 재생' },
        { icon: '🎵', title: '하이레졸루션', desc: '40mm 베릴륨 드라이버\nLDAC / aptX HD 지원' },
        { icon: '✨', title: '프리미엄 소재', desc: '알루미늄 헤드밴드\n메모리폼 이어쿠션' },
      ]
      for (const f of features) {
        const fc = add('div', featGrid, {
          name: f.title,
          style: { ...rel, width: 'auto', height: 'auto', backgroundColor: bg, borderRadius: 12, border: 'none' },
          layoutMode: 'flex',
          layoutProps: { direction: 'column', gap: 8, paddingTop: 24, paddingRight: 16, paddingBottom: 24, paddingLeft: 16, alignItems: 'center' },
          sizing: { w: 'fill', h: 'hug' },
        })
        if (fc) {
          add('text', fc, { name: `${f.title} Icon`, style: { ...rel, fontSize: 28 }, props: { content: f.icon } })
          add('text', fc, { name: `${f.title} Title`, style: { ...rel, fontSize: 14, fontWeight: 600, color: t, textAlign: 'center' }, props: { content: f.title } })
          add('text', fc, { name: `${f.title} Desc`, style: { ...rel, fontSize: 12, color: s, lineHeight: 1.5, textAlign: 'center' }, props: { content: f.desc } })
        }
      }
    }

    // Large product detail images (쇼핑몰 스타일 길쭉한 상세 이미지들)
    for (const [name, h] of [['Detail Image 1', 300], ['Detail Image 2', 250], ['Detail Image 3', 300]] as const) {
      add('div', detailSection, {
        name,
        style: { ...rel, width: 600, height: h, backgroundColor: '#f5f5f5', borderRadius: 8 },
        sizing: { w: 'fixed', h: 'fixed' },
      })
    }
  }

  // ════════════════════════════════════════════
  // 상세 스펙 테이블
  // ════════════════════════════════════════════
  const specsSection = add('div', page, {
    name: 'Specs Section',
    style: { ...rel, width: 'auto', height: 'auto', backgroundColor: bg, borderRadius: 0, border: 'none' },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 20, paddingTop: 40, paddingRight: 24, paddingBottom: 40, paddingLeft: 24, alignItems: 'stretch' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (specsSection) {
    add('text', specsSection, { name: 'Specs Title', style: { ...rel, fontSize: 20, fontWeight: 700, color: t }, props: { content: '상세 스펙' } })
    add('sc:table', specsSection, {
      name: 'Specs Table',
      style: { ...rel, width: undefined },
      props: {
        headers: ['항목', '상세'],
        rows: [
          ['제품명', 'ANC-Pro 3세대 무선 헤드폰'],
          ['모델번호', 'DVOM-ANC-P3'],
          ['드라이버', '40mm 베릴륨 다이나믹'],
          ['주파수 응답', '4Hz — 40kHz'],
          ['배터리', '40시간 (ANC ON) / 60시간 (ANC OFF)'],
          ['충전', 'USB-C 고속충전 (10분 = 3시간)'],
          ['블루투스', '5.3 멀티포인트 (2대 동시 연결)'],
          ['코덱', 'LDAC, aptX HD, AAC, SBC'],
          ['무게', '250g'],
          ['색상', '미드나이트 블랙 / 클라우드 화이트 / 네이비'],
          ['구성품', '헤드폰, USB-C 케이블, 3.5mm 케이블, 파우치, 설명서'],
        ],
      },
      sizing: { w: 'fill', h: 'hug' },
    })
  }

  // ════════════════════════════════════════════
  // 리뷰 Section
  // ════════════════════════════════════════════
  const reviewSection = add('div', page, {
    name: 'Reviews Section',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 20, paddingTop: 40, paddingRight: 24, paddingBottom: 40, paddingLeft: 24, alignItems: 'stretch' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (reviewSection) {
    // Review summary header
    const reviewHeader = add('div', reviewSection, {
      name: 'Review Header',
      style: { ...rel, width: 'auto', height: 'auto', ...box },
      layoutMode: 'flex', layoutProps: { direction: 'row', gap: 16, ...noPad, alignItems: 'end', justifyContent: 'space-between' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (reviewHeader) {
      const headerLeft = add('div', reviewHeader, {
        name: 'Header Left',
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex', layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'end' },
        sizing: { w: 'hug', h: 'hug' },
      })
      if (headerLeft) {
        add('text', headerLeft, { name: 'Review Title', style: { ...rel, fontSize: 20, fontWeight: 700, color: t }, props: { content: '구매 리뷰' } })
        add('text', headerLeft, { name: 'Review Count', style: { ...rel, fontSize: 14, color: '#3b82f6', fontWeight: 600 }, props: { content: '4,287' } })
      }
      add('text', reviewHeader, { name: 'Rating Avg', style: { ...rel, fontSize: 14, color: s }, props: { content: '★ 4.9 / 5.0' } })
    }

    // Rating bar (satisfaction summary)
    const ratingBar = add('div', reviewSection, {
      name: 'Rating Summary',
      style: { ...rel, width: 'auto', height: 'auto', backgroundColor: bg, borderRadius: 12, border: 'none' },
      layoutMode: 'flex',
      layoutProps: { direction: 'row', gap: 32, paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24, alignItems: 'center', justifyContent: 'center' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (ratingBar) {
      const scoreCol = add('div', ratingBar, {
        name: 'Score',
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex', layoutProps: { direction: 'column', gap: 4, ...noPad, alignItems: 'center' },
        sizing: { w: 'hug', h: 'hug' },
      })
      if (scoreCol) {
        add('text', scoreCol, { name: 'Big Score', style: { ...rel, fontSize: 40, fontWeight: 800, color: t }, props: { content: '4.9' } })
        add('text', scoreCol, { name: 'Stars', style: { ...rel, fontSize: 18, color: '#f59e0b' }, props: { content: '★★★★★' } })
      }
      const barCol = add('div', ratingBar, {
        name: 'Rating Bars',
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex', layoutProps: { direction: 'column', gap: 4, ...noPad, alignItems: 'stretch' },
        sizing: { w: 'fill', h: 'hug' },
      })
      if (barCol) {
        for (const [star, pct] of [['5점', 92], ['4점', 5], ['3점', 2], ['2점', 1], ['1점', 0]] as const) {
          const barRow = add('div', barCol, {
            name: `${star} Row`,
            style: { ...rel, width: 'auto', height: 'auto', ...box },
            layoutMode: 'flex', layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'center' },
            sizing: { w: 'fill', h: 'hug' },
          })
          if (barRow) {
            add('text', barRow, { name: `${star} Label`, style: { ...rel, fontSize: 12, color: s, width: 28 }, props: { content: star } })
            add('sc:progress', barRow, { name: `${star} Bar`, style: { ...rel, width: undefined }, props: { value: pct }, sizing: { w: 'fill', h: 'fixed' } })
            add('text', barRow, { name: `${star} Pct`, style: { ...rel, fontSize: 11, color: m, width: 28, textAlign: 'right' }, props: { content: `${pct}%` } })
          }
        }
      }
    }

    // Individual reviews
    const reviews = [
      { name: '김**', date: '2026.03.10', rating: '★★★★★', text: '노이즈캔슬링 성능이 정말 대단합니다. 지하철에서 음악 듣는데 주변 소리가 거의 안 들려요. 배터리도 이틀 연속 사용해도 넉넉합니다.', tag: '음질 좋아요' },
      { name: '박**', date: '2026.03.08', rating: '★★★★★', text: '직장에서 하루종일 착용해도 귀 안 아파요. 메모리폼 쿠션이 진짜 부드럽고 250g이라 가벼워서 장시간 착용 가능합니다.', tag: '착용감 최고' },
      { name: '이**', date: '2026.03.05', rating: '★★★★☆', text: '음질이랑 노이즈캔슬링은 만족인데 케이스가 좀 컸으면 좋겠어요. 그래도 가성비는 이 가격대 최고입니다.', tag: '가성비 굿' },
    ]
    for (const r of reviews) {
      const rc = add('div', reviewSection, {
        name: `Review ${r.name}`,
        style: { ...rel, width: 'auto', height: 'auto', ...box, borderBottom: `1px solid ${bd}` },
        layoutMode: 'flex',
        layoutProps: { direction: 'column', gap: 8, paddingTop: 16, paddingRight: 0, paddingBottom: 16, paddingLeft: 0, alignItems: 'start' },
        sizing: { w: 'fill', h: 'hug' },
      })
      if (rc) {
        const rHeader = add('div', rc, {
          name: `${r.name} Header`,
          style: { ...rel, width: 'auto', height: 'auto', ...box },
          layoutMode: 'flex', layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'center' },
          sizing: { w: 'fill', h: 'hug' },
        })
        if (rHeader) {
          add('text', rHeader, { name: `${r.name} Rating`, style: { ...rel, fontSize: 13, color: '#f59e0b' }, props: { content: r.rating } })
          add('sc:badge', rHeader, { name: `${r.name} Tag`, style: { ...rel }, props: { label: r.tag, variant: 'secondary' } })
        }
        add('text', rc, { name: `${r.name} Text`, style: { ...rel, fontSize: 13, color: t, lineHeight: 1.6 }, props: { content: r.text } })
        const rFooter = add('div', rc, {
          name: `${r.name} Footer`,
          style: { ...rel, width: 'auto', height: 'auto', ...box },
          layoutMode: 'flex', layoutProps: { direction: 'row', gap: 8, ...noPad, alignItems: 'center' },
          sizing: { w: 'hug', h: 'hug' },
        })
        if (rFooter) {
          add('text', rFooter, { name: `${r.name} Name`, style: { ...rel, fontSize: 12, color: m }, props: { content: r.name } })
          add('text', rFooter, { name: `${r.name} Date`, style: { ...rel, fontSize: 12, color: m }, props: { content: r.date } })
        }
      }
    }
  }

  // ════════════════════════════════════════════
  // FAQ / 자주 묻는 질문
  // ════════════════════════════════════════════
  const faqSection = add('div', page, {
    name: 'FAQ Section',
    style: { ...rel, width: 'auto', height: 'auto', backgroundColor: bg, borderRadius: 0, border: 'none' },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 16, paddingTop: 40, paddingRight: 24, paddingBottom: 40, paddingLeft: 24, alignItems: 'stretch' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (faqSection) {
    add('text', faqSection, { name: 'FAQ Title', style: { ...rel, fontSize: 20, fontWeight: 700, color: t }, props: { content: '자주 묻는 질문' } })
    add('sc:accordion', faqSection, {
      name: 'FAQ Accordion',
      style: { ...rel, width: undefined },
      props: {
        items: [
          { title: '구성품이 어떻게 되나요?', content: '헤드폰 본체, USB-C 충전 케이블, 3.5mm 오디오 케이블, 휴대용 파우치, 퀵 스타트 가이드가 포함됩니다.' },
          { title: 'A/S 기간은 얼마나 되나요?', content: '제조사 보증 2년, 구매일로부터 30일 이내 무조건 교환/환불이 가능합니다.' },
          { title: '충전하면서 사용 가능한가요?', content: '네, USB-C 충전 중에도 블루투스 사용이 가능하며, 3.5mm 유선 케이블로도 사용할 수 있습니다.' },
          { title: '이어쿠션 교체가 가능한가요?', content: '네, 교체용 이어쿠션을 별도로 구매하실 수 있습니다. (1세트 19,900원)' },
          { title: '멀티포인트 연결이란?', content: '2대의 기기에 동시 연결이 가능합니다. 예를 들어 노트북과 스마트폰을 동시에 연결해두면 자동으로 재생 중인 기기로 전환됩니다.' },
        ],
      },
      sizing: { w: 'fill', h: 'hug' },
    })
  }

  // ════════════════════════════════════════════
  // 교환/반품 안내
  // ════════════════════════════════════════════
  const returnSection = add('div', page, {
    name: 'Return Policy',
    style: { ...rel, width: 'auto', height: 'auto', ...box },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 16, paddingTop: 40, paddingRight: 24, paddingBottom: 40, paddingLeft: 24, alignItems: 'stretch' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (returnSection) {
    add('text', returnSection, { name: 'Return Title', style: { ...rel, fontSize: 20, fontWeight: 700, color: t }, props: { content: '교환/반품 안내' } })
    add('sc:table', returnSection, {
      name: 'Return Table',
      style: { ...rel, width: undefined },
      props: {
        headers: ['구분', '내용'],
        rows: [
          ['교환/반품 기간', '상품 수령 후 7일 이내'],
          ['교환/반품 비용', '단순 변심: 왕복 6,000원 / 제품 하자: 무료'],
          ['교환/반품 불가', '사용 흔적이 있는 경우, 구성품 분실'],
          ['AS 접수', '고객센터 1588-0000 (평일 09:00~18:00)'],
        ],
      },
      sizing: { w: 'fill', h: 'hug' },
    })
    add('sc:alert', returnSection, {
      name: 'Return Notice',
      style: { ...rel, width: undefined },
      props: { title: '안내', description: '제품 하자로 인한 교환/반품 시 택배비는 판매자가 부담합니다. 단순 변심에 의한 교환/반품 시 택배비는 구매자 부담입니다.', variant: 'default' },
      sizing: { w: 'fill', h: 'hug' },
    })
  }

  // ════════════════════════════════════════════
  // Footer
  // ════════════════════════════════════════════
  const footer = add('div', page, {
    name: 'Footer',
    style: { ...rel, width: 'auto', height: 'auto', backgroundColor: '#1a1a1a', borderRadius: 0, border: 'none' },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 12, paddingTop: 32, paddingRight: 24, paddingBottom: 32, paddingLeft: 24, alignItems: 'start' },
    sizing: { w: 'fill', h: 'hug' },
  })
  if (footer) {
    add('text', footer, { name: 'Footer Logo', style: { ...rel, fontSize: 16, fontWeight: 700, color: '#ffffff' }, props: { content: 'DEVOM STORE' } })
    add('text', footer, { name: 'Footer Info', style: { ...rel, fontSize: 11, color: '#888888', lineHeight: 1.8 }, props: { content: '(주)데봄스토어 | 대표: 홍길동 | 사업자등록번호: 123-45-67890\n서울특별시 강남구 테헤란로 123, 4층\n고객센터: 1588-0000 (평일 09:00~18:00)' } })
    add('sc:separator', footer, { name: 'Footer Sep', style: { ...rel, width: undefined, borderColor: '#333333' }, sizing: { w: 'fill', h: 'fixed' } })
    add('text', footer, { name: 'Copyright', style: { ...rel, fontSize: 11, color: '#666666' }, props: { content: '© 2026 DEVOM STORE. All rights reserved. | 개인정보처리방침 | 이용약관' } })
  }
}
