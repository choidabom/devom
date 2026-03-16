import type { DocumentStore } from "../../stores/DocumentStore"
import { createTemplateHelper } from "./helpers"

export function buildFoodProduct(store: DocumentStore): void {
  const root = store.elements.get(store.rootId)
  if (!root) return

  const rel = { position: "relative" as const, left: undefined, top: undefined }
  const noPad = { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 }
  const add = createTemplateHelper(store)

  // Color palette — 마켓컬리 / 식품 스타일
  const t = "#333333"
  const s = "#666666"
  const m = "#999999"
  const bd = "#eeeeee"
  const purple = "#5f0080" // 컬리 퍼플
  const green = "#2db400" // 신선 그린
  const bg = "#fafafa"
  const box = { backgroundColor: "transparent" as const, borderRadius: 0, border: "none" }

  const W = 800
  const page = add("div", store.rootId, {
    name: "Page",
    style: { left: 0, top: 0, width: W, height: "auto", backgroundColor: "#ffffff", borderRadius: 0, border: "none" },
    layoutMode: "flex",
    layoutProps: { direction: "column", gap: 0, ...noPad, alignItems: "stretch" },
  })
  if (!page) return

  // ════════════════════════════════════════════
  // Top Bar
  // ════════════════════════════════════════════
  const topBar = add("div", page, {
    name: "Top Bar",
    style: { ...rel, width: "auto", height: "auto", backgroundColor: purple, borderRadius: 0, border: "none" },
    layoutMode: "flex",
    layoutProps: { direction: "row", gap: 0, paddingTop: 8, paddingRight: 24, paddingBottom: 8, paddingLeft: 24, alignItems: "center", justifyContent: "center" },
    sizing: { w: "fill", h: "hug" },
  })
  if (topBar) {
    add("text", topBar, {
      name: "Top Notice",
      style: { ...rel, fontSize: 12, fontWeight: 500, color: "#ffffff" },
      props: { content: "🧊 새벽배송 마감 오늘 밤 11시 | 첫 주문 시 5,000원 할인" },
    })
  }

  // ════════════════════════════════════════════
  // Navigation
  // ════════════════════════════════════════════
  const nav = add("div", page, {
    name: "Nav",
    style: { ...rel, width: "auto", height: "auto", ...box, borderBottom: `1px solid ${bd}` },
    layoutMode: "flex",
    layoutProps: { direction: "row", gap: 20, paddingTop: 14, paddingRight: 24, paddingBottom: 14, paddingLeft: 24, alignItems: "center", justifyContent: "space-between" },
    sizing: { w: "fill", h: "hug" },
  })
  if (nav) {
    add("text", nav, { name: "Logo", style: { ...rel, fontSize: 20, fontWeight: 800, color: purple }, props: { content: "FRESH MARKET" } })
    const navLinks = add("div", nav, {
      name: "Nav Links",
      style: { ...rel, width: "auto", height: "auto", ...box },
      layoutMode: "flex",
      layoutProps: { direction: "row", gap: 20, ...noPad, alignItems: "center" },
      sizing: { w: "hug", h: "hug" },
    })
    if (navLinks) {
      for (const link of ["신상품", "베스트", "알뜰쇼핑", "특가/혜택"]) {
        add("text", navLinks, { name: link, style: { ...rel, fontSize: 14, fontWeight: 500, color: t }, props: { content: link } })
      }
    }
    add("sc:button", nav, { name: "Cart", style: { ...rel }, props: { label: "장바구니", variant: "outline", size: "sm" } })
  }

  // ════════════════════════════════════════════
  // Breadcrumb
  // ════════════════════════════════════════════
  const bc = add("div", page, {
    name: "Breadcrumb",
    style: { ...rel, width: "auto", height: "auto", ...box },
    layoutMode: "flex",
    layoutProps: { direction: "row", gap: 8, paddingTop: 10, paddingRight: 24, paddingBottom: 10, paddingLeft: 24, alignItems: "center" },
    sizing: { w: "fill", h: "hug" },
  })
  if (bc) {
    add("text", bc, { name: "BC", style: { ...rel, fontSize: 12, color: m }, props: { content: "홈 > 과일·견과·쌀 > 국산 과일 > 사과·배" } })
  }

  // ════════════════════════════════════════════
  // Hero — Product Image + Info
  // ════════════════════════════════════════════
  const hero = add("div", page, {
    name: "Hero Section",
    style: { ...rel, width: "auto", height: "auto", ...box },
    layoutMode: "flex",
    layoutProps: { direction: "row", gap: 32, paddingTop: 20, paddingRight: 24, paddingBottom: 32, paddingLeft: 24, alignItems: "start" },
    sizing: { w: "fill", h: "hug" },
  })
  if (hero) {
    // Product image
    const imgCol = add("div", hero, {
      name: "Image Column",
      style: { ...rel, width: 380, height: "auto", ...box },
      layoutMode: "flex",
      layoutProps: { direction: "column", gap: 8, ...noPad, alignItems: "stretch" },
      sizing: { w: "fixed", h: "hug" },
    })
    if (imgCol) {
      add("div", imgCol, {
        name: "Main Image",
        style: { ...rel, width: 380, height: 380, backgroundColor: "#fef9f0", borderRadius: 8, border: `1px solid ${bd}` },
        sizing: { w: "fill", h: "fixed" },
      })
      const thumbRow = add("div", imgCol, {
        name: "Thumbnails",
        style: { ...rel, width: "auto", height: "auto", ...box },
        layoutMode: "flex",
        layoutProps: { direction: "row", gap: 6, ...noPad, alignItems: "center" },
        sizing: { w: "fill", h: "hug" },
      })
      if (thumbRow) {
        for (let i = 1; i <= 5; i++) {
          add("div", thumbRow, {
            name: `Thumb ${i}`,
            style: {
              ...rel,
              width: 64,
              height: 64,
              backgroundColor: i === 1 ? "#fef3e0" : "#f5f5f5",
              borderRadius: 4,
              border: i === 1 ? `2px solid ${purple}` : `1px solid ${bd}`,
            },
            sizing: { w: "fixed", h: "fixed" },
          })
        }
      }
    }

    // Product info
    const info = add("div", hero, {
      name: "Product Info",
      style: { ...rel, width: "auto", height: "auto", ...box },
      layoutMode: "flex",
      layoutProps: { direction: "column", gap: 12, ...noPad, alignItems: "start" },
      sizing: { w: "fill", h: "hug" },
    })
    if (info) {
      // Badges
      const badgeRow = add("div", info, {
        name: "Badges",
        style: { ...rel, width: "auto", height: "auto", ...box },
        layoutMode: "flex",
        layoutProps: { direction: "row", gap: 6, ...noPad, alignItems: "center" },
        sizing: { w: "hug", h: "hug" },
      })
      if (badgeRow) {
        add("sc:badge", badgeRow, { name: "New Badge", style: { ...rel }, props: { label: "한정수량", variant: "destructive" } })
        add("sc:badge", badgeRow, { name: "Kurly Badge", style: { ...rel }, props: { label: "Only", variant: "secondary" } })
      }

      add("text", info, {
        name: "Product Title",
        style: { ...rel, fontSize: 22, fontWeight: 700, color: t, lineHeight: 1.4 },
        props: { content: "[산지직송] 경북 영주 꿀사과\n프리미엄 선물세트 3kg (9~11과)" },
      })
      add("text", info, { name: "Subtitle", style: { ...rel, fontSize: 13, color: m, lineHeight: 1.5 }, props: { content: "당도 14Brix 이상 보장, GAP 인증 농가에서 직접 배송" } })

      // Rating
      const ratingRow = add("div", info, {
        name: "Rating",
        style: { ...rel, width: "auto", height: "auto", ...box },
        layoutMode: "flex",
        layoutProps: { direction: "row", gap: 8, ...noPad, alignItems: "center" },
        sizing: { w: "hug", h: "hug" },
      })
      if (ratingRow) {
        add("text", ratingRow, { name: "Stars", style: { ...rel, fontSize: 14, color: "#f59e0b" }, props: { content: "★★★★★" } })
        add("text", ratingRow, { name: "Count", style: { ...rel, fontSize: 13, color: purple, textDecoration: "underline" }, props: { content: "2,156개 후기" } })
      }

      add("sc:separator", info, { name: "Sep1", style: { ...rel, width: undefined }, sizing: { w: "fill", h: "fixed" } })

      // Price (할인율)
      const priceSection = add("div", info, {
        name: "Price Section",
        style: { ...rel, width: "auto", height: "auto", ...box },
        layoutMode: "flex",
        layoutProps: { direction: "column", gap: 4, ...noPad, alignItems: "start" },
        sizing: { w: "fill", h: "hug" },
      })
      if (priceSection) {
        const origRow = add("div", priceSection, {
          name: "Orig Row",
          style: { ...rel, width: "auto", height: "auto", ...box },
          layoutMode: "flex",
          layoutProps: { direction: "row", gap: 6, ...noPad, alignItems: "center" },
          sizing: { w: "hug", h: "hug" },
        })
        if (origRow) {
          add("text", origRow, { name: "Orig Label", style: { ...rel, fontSize: 13, color: m }, props: { content: "정가" } })
          add("text", origRow, { name: "Orig Price", style: { ...rel, fontSize: 14, color: m, textDecoration: "line-through" }, props: { content: "42,000원" } })
        }
        const saleRow = add("div", priceSection, {
          name: "Sale Row",
          style: { ...rel, width: "auto", height: "auto", ...box },
          layoutMode: "flex",
          layoutProps: { direction: "row", gap: 8, ...noPad, alignItems: "end" },
          sizing: { w: "hug", h: "hug" },
        })
        if (saleRow) {
          add("text", saleRow, { name: "Discount", style: { ...rel, fontSize: 28, fontWeight: 800, color: "#ff5500" }, props: { content: "30%" } })
          add("text", saleRow, { name: "Price", style: { ...rel, fontSize: 28, fontWeight: 800, color: t }, props: { content: "29,400원" } })
        }
        const benefitRow = add("div", priceSection, {
          name: "Benefit",
          style: { ...rel, width: "auto", height: "auto", ...box },
          layoutMode: "flex",
          layoutProps: { direction: "row", gap: 6, ...noPad, alignItems: "center" },
          sizing: { w: "hug", h: "hug" },
        })
        if (benefitRow) {
          add("sc:badge", benefitRow, { name: "Point", style: { ...rel }, props: { label: "적립", variant: "outline" } })
          add("text", benefitRow, { name: "Point Text", style: { ...rel, fontSize: 12, color: s }, props: { content: "구매 시 294P 적립 (1%)" } })
        }
      }

      add("sc:separator", info, { name: "Sep2", style: { ...rel, width: undefined }, sizing: { w: "fill", h: "fixed" } })

      // Delivery info
      const delInfo = add("div", info, {
        name: "Delivery",
        style: { ...rel, width: "auto", height: "auto", ...box },
        layoutMode: "flex",
        layoutProps: { direction: "column", gap: 8, ...noPad, alignItems: "start" },
        sizing: { w: "fill", h: "hug" },
      })
      if (delInfo) {
        const rows = [
          ["배송", "새벽배송 (23시 전 주문 시 내일 7시 전 도착)"],
          ["판매자", "영주 GAP인증 사과농장"],
          ["포장", "냉장 (스티로폼 아이스팩)"],
          ["원산지", "국산 (경북 영주)"],
          ["유통기한", "수령 후 냉장 보관 14일"],
        ]
        for (const [label, value] of rows) {
          const dr = add("div", delInfo, {
            name: `Del ${label}`,
            style: { ...rel, width: "auto", height: "auto", ...box },
            layoutMode: "flex",
            layoutProps: { direction: "row", gap: 12, ...noPad, alignItems: "start" },
            sizing: { w: "fill", h: "hug" },
          })
          if (dr) {
            add("text", dr, { name: `${label} L`, style: { ...rel, fontSize: 13, fontWeight: 600, color: s, width: 56 }, props: { content: label } })
            add("text", dr, { name: `${label} V`, style: { ...rel, fontSize: 13, color: t, lineHeight: 1.4 }, props: { content: value } })
          }
        }
      }

      add("sc:separator", info, { name: "Sep3", style: { ...rel, width: undefined }, sizing: { w: "fill", h: "fixed" } })

      // Quantity selector row
      const qtyRow = add("div", info, {
        name: "Quantity Row",
        style: { ...rel, width: "auto", height: "auto", ...box },
        layoutMode: "flex",
        layoutProps: { direction: "row", gap: 8, ...noPad, alignItems: "center" },
        sizing: { w: "fill", h: "hug" },
      })
      if (qtyRow) {
        add("text", qtyRow, { name: "Qty Label", style: { ...rel, fontSize: 13, fontWeight: 600, color: t }, props: { content: "수량" } })
        add("sc:button", qtyRow, { name: "Minus", style: { ...rel }, props: { label: "−", variant: "outline", size: "sm" } })
        add("text", qtyRow, { name: "Qty", style: { ...rel, fontSize: 14, fontWeight: 600, color: t, width: 30, textAlign: "center" }, props: { content: "1" } })
        add("sc:button", qtyRow, { name: "Plus", style: { ...rel }, props: { label: "+", variant: "outline", size: "sm" } })
      }

      // Total price
      const totalRow = add("div", info, {
        name: "Total Row",
        style: { ...rel, width: "auto", height: "auto", backgroundColor: bg, borderRadius: 8, border: "none" },
        layoutMode: "flex",
        layoutProps: { direction: "row", gap: 8, paddingTop: 12, paddingRight: 16, paddingBottom: 12, paddingLeft: 16, alignItems: "center", justifyContent: "space-between" },
        sizing: { w: "fill", h: "hug" },
      })
      if (totalRow) {
        add("text", totalRow, { name: "Total Label", style: { ...rel, fontSize: 14, fontWeight: 600, color: t }, props: { content: "총 상품금액" } })
        add("text", totalRow, { name: "Total Price", style: { ...rel, fontSize: 20, fontWeight: 800, color: t }, props: { content: "29,400원" } })
      }

      // CTA
      const cta = add("div", info, {
        name: "CTA",
        style: { ...rel, width: "auto", height: "auto", ...box },
        layoutMode: "flex",
        layoutProps: { direction: "row", gap: 8, ...noPad, alignItems: "center" },
        sizing: { w: "fill", h: "hug" },
      })
      if (cta) {
        add("sc:button", cta, { name: "Wishlist", style: { ...rel }, props: { label: "♡", variant: "outline", size: "lg" } })
        add("sc:button", cta, { name: "Cart", style: { ...rel }, props: { label: "장바구니 담기", variant: "outline", size: "lg" } })
        add("sc:button", cta, { name: "Buy", style: { ...rel }, props: { label: "바로 구매", variant: "default", size: "lg" } })
      }
    }
  }

  // ════════════════════════════════════════════
  // 안내 배너 (신선식품 안내)
  // ════════════════════════════════════════════
  const noticeBanner = add("div", page, {
    name: "Fresh Notice",
    style: { ...rel, width: "auto", height: "auto", backgroundColor: "#f0fdf4", borderRadius: 0, border: "none" },
    layoutMode: "flex",
    layoutProps: { direction: "row", gap: 12, paddingTop: 14, paddingRight: 24, paddingBottom: 14, paddingLeft: 24, alignItems: "center" },
    sizing: { w: "fill", h: "hug" },
  })
  if (noticeBanner) {
    add("text", noticeBanner, { name: "Fresh Icon", style: { ...rel, fontSize: 18 }, props: { content: "🌿" } })
    add("text", noticeBanner, {
      name: "Fresh Text",
      style: { ...rel, fontSize: 13, color: green, fontWeight: 600, lineHeight: 1.5 },
      props: { content: "이 상품은 신선식품으로 단순 변심에 의한 교환/반품이 어렵습니다. 상품 설명을 꼼꼼히 확인해주세요." },
    })
  }

  // ════════════════════════════════════════════
  // Tab Navigation
  // ════════════════════════════════════════════
  const tabNav = add("div", page, {
    name: "Tab Nav",
    style: { ...rel, width: "auto", height: "auto", backgroundColor: "#ffffff", borderRadius: 0, borderTop: `2px solid ${t}`, borderBottom: `1px solid ${bd}` },
    layoutMode: "flex",
    layoutProps: { direction: "row", gap: 0, ...noPad, alignItems: "stretch" },
    sizing: { w: "fill", h: "hug" },
  })
  if (tabNav) {
    const tabs = ["상품설명", "후기 (2,156)", "문의 (89)", "배송/교환/반품"]
    for (let i = 0; i < tabs.length; i++) {
      add("text", tabNav, {
        name: tabs[i]!,
        style: {
          ...rel,
          fontSize: 14,
          fontWeight: i === 0 ? 700 : 400,
          color: i === 0 ? t : s,
          padding: "14px 0",
          textAlign: "center",
          borderBottom: i === 0 ? `2px solid ${t}` : "none",
        },
        props: { content: tabs[i]! },
        sizing: { w: "fill", h: "hug" },
      })
    }
  }

  // ════════════════════════════════════════════
  // 상품 상세 설명
  // ════════════════════════════════════════════
  const detailSection = add("div", page, {
    name: "Detail Section",
    style: { ...rel, width: "auto", height: "auto", ...box },
    layoutMode: "flex",
    layoutProps: { direction: "column", gap: 32, paddingTop: 40, paddingRight: 24, paddingBottom: 40, paddingLeft: 24, alignItems: "center" },
    sizing: { w: "fill", h: "hug" },
  })
  if (detailSection) {
    // Hero text
    add("text", detailSection, {
      name: "Detail Hero",
      style: { ...rel, fontSize: 26, fontWeight: 700, color: t, textAlign: "center", lineHeight: 1.5 },
      props: { content: "해발 300m 고랭지에서 자란\n당도 14Brix 프리미엄 꿀사과" },
    })
    add("text", detailSection, {
      name: "Detail Sub",
      style: { ...rel, fontSize: 14, color: s, textAlign: "center", lineHeight: 1.7 },
      props: { content: "경북 영주의 깨끗한 공기와 일교차가 만들어낸\n아삭하고 달콤한 최고급 사과를 만나보세요." },
    })

    // Detail image 1
    add("div", detailSection, {
      name: "Detail Image 1",
      style: { ...rel, width: 600, height: 360, backgroundColor: "#fef9f0", borderRadius: 12 },
      sizing: { w: "fixed", h: "fixed" },
    })

    // Feature cards
    const featGrid = add("div", detailSection, {
      name: "Feature Grid",
      style: { ...rel, width: "auto", height: "auto", ...box },
      layoutMode: "flex",
      layoutProps: { direction: "row", gap: 12, ...noPad, alignItems: "stretch" },
      sizing: { w: "fill", h: "hug" },
    })
    if (featGrid) {
      const features = [
        { icon: "🍎", title: "당도 14Brix+", desc: "당도선별기로 검증된\n최상급 과일만 선별" },
        { icon: "🏔️", title: "영주 고랭지", desc: "해발 300m 일교차가\n만든 아삭한 식감" },
        { icon: "🌱", title: "GAP 인증", desc: "우수농산물인증\n안전한 재배 환경" },
        { icon: "📦", title: "산지 직송", desc: "수확 당일 포장\n냉장 배송 보장" },
      ]
      for (const f of features) {
        const fc = add("div", featGrid, {
          name: f.title,
          style: { ...rel, width: "auto", height: "auto", backgroundColor: bg, borderRadius: 12, border: "none" },
          layoutMode: "flex",
          layoutProps: { direction: "column", gap: 8, paddingTop: 20, paddingRight: 14, paddingBottom: 20, paddingLeft: 14, alignItems: "center" },
          sizing: { w: "fill", h: "hug" },
        })
        if (fc) {
          add("text", fc, { name: `${f.title} Icon`, style: { ...rel, fontSize: 28 }, props: { content: f.icon } })
          add("text", fc, { name: `${f.title} T`, style: { ...rel, fontSize: 14, fontWeight: 700, color: t, textAlign: "center" }, props: { content: f.title } })
          add("text", fc, { name: `${f.title} D`, style: { ...rel, fontSize: 12, color: s, lineHeight: 1.5, textAlign: "center" }, props: { content: f.desc } })
        }
      }
    }

    // More detail images
    add("div", detailSection, {
      name: "Detail Image 2",
      style: { ...rel, width: 600, height: 300, backgroundColor: "#f5f0e8", borderRadius: 8 },
      sizing: { w: "fixed", h: "fixed" },
    })

    // 이런 분께 추천
    const recoSection = add("div", detailSection, {
      name: "Recommendation",
      style: { ...rel, width: "auto", height: "auto", backgroundColor: "#fffbeb", borderRadius: 12, border: "none" },
      layoutMode: "flex",
      layoutProps: { direction: "column", gap: 12, paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24, alignItems: "start" },
      sizing: { w: "fill", h: "hug" },
    })
    if (recoSection) {
      add("text", recoSection, { name: "Reco Title", style: { ...rel, fontSize: 16, fontWeight: 700, color: t }, props: { content: "🎁 이런 분께 추천해요" } })
      const recos = [
        "명절·생일 선물용 과일을 찾으시는 분",
        "아이 간식으로 안전한 과일을 원하시는 분",
        "높은 당도의 프리미엄 사과를 좋아하시는 분",
        "산지 직송 신선한 과일을 받고 싶으신 분",
      ]
      for (const r of recos) {
        add("text", recoSection, { name: r.slice(0, 10), style: { ...rel, fontSize: 13, color: t, lineHeight: 1.5 }, props: { content: `✓ ${r}` } })
      }
    }

    add("div", detailSection, {
      name: "Detail Image 3",
      style: { ...rel, width: 600, height: 280, backgroundColor: "#fef0f0", borderRadius: 8 },
      sizing: { w: "fixed", h: "fixed" },
    })
  }

  // ════════════════════════════════════════════
  // 상품 정보 테이블
  // ════════════════════════════════════════════
  const infoSection = add("div", page, {
    name: "Product Info Table",
    style: { ...rel, width: "auto", height: "auto", backgroundColor: bg, borderRadius: 0, border: "none" },
    layoutMode: "flex",
    layoutProps: { direction: "column", gap: 16, paddingTop: 40, paddingRight: 24, paddingBottom: 40, paddingLeft: 24, alignItems: "stretch" },
    sizing: { w: "fill", h: "hug" },
  })
  if (infoSection) {
    add("text", infoSection, { name: "Info Title", style: { ...rel, fontSize: 18, fontWeight: 700, color: t }, props: { content: "상품 필수 표기정보" } })
    add("sc:table", infoSection, {
      name: "Info Table",
      style: { ...rel, width: undefined },
      props: {
        headers: ["항목", "내용"],
        rows: [
          ["품목", "사과"],
          ["품종", "부사 (후지)"],
          ["산지", "경상북도 영주시"],
          ["중량/수량", "3kg (9~11과)"],
          ["등급", "특등급"],
          ["당도", "14Brix 이상"],
          ["생산자", "영주 사과마을 영농조합"],
          ["보관방법", "냉장보관 (0~5℃)"],
          ["유통기한", "수령 후 14일 (냉장 보관 시)"],
          ["알레르기", "해당 없음"],
        ],
      },
      sizing: { w: "fill", h: "hug" },
    })
  }

  // ════════════════════════════════════════════
  // 후기 Section
  // ════════════════════════════════════════════
  const reviewSection = add("div", page, {
    name: "Reviews",
    style: { ...rel, width: "auto", height: "auto", ...box },
    layoutMode: "flex",
    layoutProps: { direction: "column", gap: 16, paddingTop: 40, paddingRight: 24, paddingBottom: 40, paddingLeft: 24, alignItems: "stretch" },
    sizing: { w: "fill", h: "hug" },
  })
  if (reviewSection) {
    // Review header
    const rHeader = add("div", reviewSection, {
      name: "Review Header",
      style: { ...rel, width: "auto", height: "auto", ...box },
      layoutMode: "flex",
      layoutProps: { direction: "row", gap: 12, ...noPad, alignItems: "end", justifyContent: "space-between" },
      sizing: { w: "fill", h: "hug" },
    })
    if (rHeader) {
      const hl = add("div", rHeader, {
        name: "Header Left",
        style: { ...rel, width: "auto", height: "auto", ...box },
        layoutMode: "flex",
        layoutProps: { direction: "row", gap: 8, ...noPad, alignItems: "end" },
        sizing: { w: "hug", h: "hug" },
      })
      if (hl) {
        add("text", hl, { name: "Review Title", style: { ...rel, fontSize: 18, fontWeight: 700, color: t }, props: { content: "구매 후기" } })
        add("text", hl, { name: "Review Count", style: { ...rel, fontSize: 14, fontWeight: 600, color: purple }, props: { content: "2,156" } })
      }
      add("text", rHeader, { name: "Avg", style: { ...rel, fontSize: 14, color: s }, props: { content: "★ 4.8 / 5.0" } })
    }

    // Satisfaction tags
    const tagRow = add("div", reviewSection, {
      name: "Tags",
      style: { ...rel, width: "auto", height: "auto", ...box },
      layoutMode: "flex",
      layoutProps: { direction: "row", gap: 6, ...noPad, alignItems: "center" },
      sizing: { w: "fill", h: "hug" },
    })
    if (tagRow) {
      for (const tag of ["당도 높아요 (892)", "선물용 좋아요 (654)", "신선해요 (521)", "재구매 의사 (1,203)"]) {
        add("sc:badge", tagRow, { name: tag.slice(0, 8), style: { ...rel }, props: { label: tag, variant: "secondary" } })
      }
    }

    // Reviews
    const reviews = [
      {
        name: "최**",
        date: "2026.03.11",
        rating: "★★★★★",
        text: "부모님 생신 선물로 보내드렸는데 너무 좋아하셨어요! 사과 하나하나 크기도 균일하고 당도가 정말 높아서 생과일주스로도 딱이에요. 포장도 꼼꼼하게 되어있었습니다.",
        tag: "선물용 좋아요",
        hasPhoto: true,
      },
      {
        name: "정**",
        date: "2026.03.09",
        rating: "★★★★★",
        text: "3번째 재구매입니다. 마트에서 사는 것보다 훨씬 맛있고 신선해요. 아이들이 사과를 안 좋아했는데 이 사과는 잘 먹어요. 당도 보장이라 그런지 진짜 달아요.",
        tag: "재구매 의사",
      },
      {
        name: "한**",
        date: "2026.03.07",
        rating: "★★★★☆",
        text: "전체적으로 만족합니다. 사과 크기가 조금 들쭉날쭉한 게 아쉽지만 맛은 확실해요. 아삭하고 당도 높고요. 배송도 빨라서 좋았습니다.",
        tag: "당도 높아요",
      },
    ]
    for (const r of reviews) {
      const rc = add("div", reviewSection, {
        name: `Review ${r.name}`,
        style: { ...rel, width: "auto", height: "auto", ...box, borderBottom: `1px solid ${bd}` },
        layoutMode: "flex",
        layoutProps: { direction: "column", gap: 8, paddingTop: 16, paddingRight: 0, paddingBottom: 16, paddingLeft: 0, alignItems: "start" },
        sizing: { w: "fill", h: "hug" },
      })
      if (rc) {
        const rh = add("div", rc, {
          name: `${r.name} H`,
          style: { ...rel, width: "auto", height: "auto", ...box },
          layoutMode: "flex",
          layoutProps: { direction: "row", gap: 8, ...noPad, alignItems: "center" },
          sizing: { w: "fill", h: "hug" },
        })
        if (rh) {
          add("text", rh, { name: `${r.name} Star`, style: { ...rel, fontSize: 13, color: "#f59e0b" }, props: { content: r.rating } })
          add("sc:badge", rh, { name: `${r.name} Tag`, style: { ...rel }, props: { label: r.tag, variant: "secondary" } })
        }
        add("text", rc, { name: `${r.name} Text`, style: { ...rel, fontSize: 13, color: t, lineHeight: 1.7 }, props: { content: r.text } })
        if (r.hasPhoto) {
          const photoRow = add("div", rc, {
            name: `${r.name} Photos`,
            style: { ...rel, width: "auto", height: "auto", ...box },
            layoutMode: "flex",
            layoutProps: { direction: "row", gap: 6, ...noPad, alignItems: "center" },
            sizing: { w: "hug", h: "hug" },
          })
          if (photoRow) {
            for (let i = 0; i < 3; i++) {
              add("div", photoRow, {
                name: `Photo ${i + 1}`,
                style: { ...rel, width: 64, height: 64, backgroundColor: "#fef9f0", borderRadius: 6, border: `1px solid ${bd}` },
              })
            }
          }
        }
        const rf = add("div", rc, {
          name: `${r.name} F`,
          style: { ...rel, width: "auto", height: "auto", ...box },
          layoutMode: "flex",
          layoutProps: { direction: "row", gap: 8, ...noPad, alignItems: "center" },
          sizing: { w: "hug", h: "hug" },
        })
        if (rf) {
          add("text", rf, { name: `${r.name} N`, style: { ...rel, fontSize: 12, color: m }, props: { content: r.name } })
          add("text", rf, { name: `${r.name} D`, style: { ...rel, fontSize: 12, color: m }, props: { content: r.date } })
        }
      }
    }
  }

  // ════════════════════════════════════════════
  // 배송/교환/반품 안내
  // ════════════════════════════════════════════
  const returnSection = add("div", page, {
    name: "Return Policy",
    style: { ...rel, width: "auto", height: "auto", backgroundColor: bg, borderRadius: 0, border: "none" },
    layoutMode: "flex",
    layoutProps: { direction: "column", gap: 16, paddingTop: 40, paddingRight: 24, paddingBottom: 40, paddingLeft: 24, alignItems: "stretch" },
    sizing: { w: "fill", h: "hug" },
  })
  if (returnSection) {
    add("text", returnSection, { name: "Return Title", style: { ...rel, fontSize: 18, fontWeight: 700, color: t }, props: { content: "배송/교환/반품 안내" } })
    add("sc:table", returnSection, {
      name: "Return Table",
      style: { ...rel, width: undefined },
      props: {
        headers: ["구분", "내용"],
        rows: [
          ["배송방법", "새벽배송 (23시 전 주문 → 익일 7시 전 도착)"],
          ["배송비", "무료배송 (도서산간 추가 3,000원)"],
          ["교환/반품", "상품 하자 시 수령 후 3일 이내 (사진 첨부 필수)"],
          ["교환/반품 불가", "단순 변심 (신선식품 특성상)"],
          ["고객센터", "1588-1234 (평일 09:00~18:00)"],
        ],
      },
      sizing: { w: "fill", h: "hug" },
    })
    add("sc:alert", returnSection, {
      name: "Fresh Notice",
      style: { ...rel, width: undefined },
      props: {
        title: "신선식품 안내",
        description: "본 상품은 신선식품으로 단순 변심에 의한 교환/반품이 불가합니다. 수령 즉시 상태를 확인해주시고, 문제 발생 시 사진과 함께 고객센터로 연락해주세요.",
        variant: "default",
      },
      sizing: { w: "fill", h: "hug" },
    })
  }

  // ════════════════════════════════════════════
  // Footer
  // ════════════════════════════════════════════
  const footer = add("div", page, {
    name: "Footer",
    style: { ...rel, width: "auto", height: "auto", backgroundColor: "#333333", borderRadius: 0, border: "none" },
    layoutMode: "flex",
    layoutProps: { direction: "column", gap: 10, paddingTop: 28, paddingRight: 24, paddingBottom: 28, paddingLeft: 24, alignItems: "start" },
    sizing: { w: "fill", h: "hug" },
  })
  if (footer) {
    add("text", footer, { name: "Footer Logo", style: { ...rel, fontSize: 16, fontWeight: 700, color: "#ffffff" }, props: { content: "FRESH MARKET" } })
    add("text", footer, {
      name: "Footer Info",
      style: { ...rel, fontSize: 11, color: "#aaaaaa", lineHeight: 1.8 },
      props: {
        content:
          "(주)프레시마켓 | 대표: 김신선 | 사업자등록번호: 987-65-43210\n서울특별시 송파구 올림픽로 456, 3층\n통신판매업신고: 제2026-서울송파-1234호\n고객센터: 1588-1234 (평일 09:00~18:00)",
      },
    })
    add("sc:separator", footer, { name: "Footer Sep", style: { ...rel, width: undefined, borderColor: "#555555" }, sizing: { w: "fill", h: "fixed" } })
    add("text", footer, {
      name: "Copyright",
      style: { ...rel, fontSize: 11, color: "#888888" },
      props: { content: "© 2026 FRESH MARKET. All rights reserved. | 개인정보처리방침 | 이용약관 | 사업자정보확인" },
    })
  }
}
