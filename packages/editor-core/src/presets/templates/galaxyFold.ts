import type { DocumentStore } from "../../stores/DocumentStore"
import { createTemplateHelper } from "./helpers"

/**
 * Galaxy Z Fold7 Buy 페이지 특장점(bcFeatures) 섹션 — 실제 페이지 1:1 재현
 * 49개 wrap-component + Hero KV를 순서대로 배치
 */
export function buildGalaxyFold(store: DocumentStore): void {
  const root = store.elements.get(store.rootId)
  if (!root) return

  const rel = { position: 'relative' as const, left: undefined, top: undefined }
  const noPad = { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 }
  const add = createTemplateHelper(store)

  const box = { backgroundColor: 'transparent' as const, borderRadius: 0, border: 'none' }

  const TITLE_SIZE = 46
  const DESC_SIZE = 16
  const DISC_SIZE = 12
  const PAD_NRML = 60

  const W = 1440

  const page = add('div', store.rootId, {
    name: 'Page',
    style: { left: 0, top: 0, width: W, height: 'auto', backgroundColor: '#ffffff', borderRadius: 0, border: 'none' },
    layoutMode: 'flex',
    layoutProps: { direction: 'column', gap: 0, ...noPad, alignItems: 'stretch' },
  })
  if (!page) return

  // ──────────────────────────────────────────
  // Helper: 각 Samsung 컴포넌트 유형별 빌더
  // ──────────────────────────────────────────

  /** textbox-simple: 면책조항/설명 텍스트 */
  function textSimple(title: string, disc: string, bg: string, tc: string) {
    const sec = add('div', page, {
      name: (title || disc).slice(0, 20) || 'Text',
      style: { ...rel, width: 'auto', height: 'auto', backgroundColor: bg, borderRadius: 0, border: 'none' },
      layoutMode: 'flex',
      layoutProps: { direction: 'column', gap: 8, paddingTop: title ? PAD_NRML : 16, paddingRight: 40, paddingBottom: title ? PAD_NRML : 16, paddingLeft: 40, alignItems: 'center' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (!sec) return
    if (title) {
      add('text', sec, {
        name: 'Title',
        style: { ...rel, fontSize: TITLE_SIZE, fontWeight: 700, color: tc || '#000000', textAlign: 'center', lineHeight: 1.17 },
        props: { content: title },
      })
    }
    if (disc) {
      add('text', sec, {
        name: 'Disc',
        style: { ...rel, fontSize: DISC_SIZE, color: '#888888', textAlign: 'center', lineHeight: 1.77 },
        props: { content: disc },
      })
    }
  }

  /** textbox-simple stc-component: 강조 마케팅 문구 */
  function stcText(title: string, bg: string, tc: string) {
    const sec = add('div', page, {
      name: title.slice(0, 20),
      style: { ...rel, width: 'auto', height: 'auto', backgroundColor: bg, borderRadius: 0, border: 'none' },
      layoutMode: 'flex',
      layoutProps: { direction: 'column', gap: 0, paddingTop: PAD_NRML, paddingRight: 40, paddingBottom: PAD_NRML, paddingLeft: 40, alignItems: 'center' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (!sec) return
    add('text', sec, {
      name: 'Desc',
      style: { ...rel, fontSize: DESC_SIZE, fontWeight: 400, color: tc || '#000000', textAlign: 'center', lineHeight: 1.875, letterSpacing: -0.4 },
      props: { content: title },
    })
  }

  /** feature-benefit img-bottom: 타이틀 위 + 이미지/비디오 아래 */
  function imgBottom(title: string, disc: string, bg: string, tc: string, imgUrl: string, videoUrl: string, imgHeight = 600) {
    const sec = add('div', page, {
      name: (title || 'Feature').slice(0, 20),
      style: { ...rel, width: 'auto', height: 'auto', backgroundColor: bg, borderRadius: 0, border: 'none' },
      layoutMode: 'flex',
      layoutProps: { direction: 'column', gap: 0, ...noPad, alignItems: 'center' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (!sec) return
    if (title || disc) {
      const textArea = add('div', sec, {
        name: 'Text Area',
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex',
        layoutProps: { direction: 'column', gap: 12, paddingTop: PAD_NRML, paddingRight: 40, paddingBottom: 32, paddingLeft: 40, alignItems: 'center' },
        sizing: { w: 'fill', h: 'hug' },
      })
      if (textArea) {
        if (title) {
          add('text', textArea, {
            name: 'Title',
            style: { ...rel, fontSize: TITLE_SIZE, fontWeight: 700, color: tc || '#000000', textAlign: 'center', lineHeight: 1.17 },
            props: { content: title },
          })
        }
        if (disc) {
          add('text', textArea, {
            name: 'Disc',
            style: { ...rel, fontSize: DISC_SIZE, color: bg === '#000000' ? '#999999' : '#888888', textAlign: 'center', lineHeight: 1.77 },
            props: { content: disc },
          })
        }
      }
    }
    if (imgUrl) {
      const src = imgUrl.startsWith('//') ? 'https:' + imgUrl : imgUrl
      add('image', sec, {
        name: 'Visual',
        style: { ...rel, width: W, height: imgHeight, objectFit: 'cover' },
        props: { src, alt: title || 'Feature image' },
        sizing: { w: 'fill', h: 'fill' },
      })
    } else if (videoUrl) {
      const vSrc = videoUrl.startsWith('//') ? 'https:' + videoUrl : videoUrl
      add('video', sec, {
        name: 'Video',
        style: { ...rel, width: W, height: imgHeight, objectFit: 'cover' },
        props: { src: vSrc, autoplay: true, muted: true, loop: true, controls: false },
        sizing: { w: 'fill', h: 'fill' },
      })
    }
    if (disc && (imgUrl || videoUrl)) {
      add('text', sec, {
        name: 'Bottom Disc',
        style: { ...rel, fontSize: DISC_SIZE, color: bg === '#000000' ? '#666666' : '#888888', textAlign: 'center', lineHeight: 1.77, paddingTop: 16, paddingBottom: 16 },
        props: { content: disc },
      })
    }
  }

  /** feature-benefit img-left-5to5 / img-right-5to5: 50/50 분할 */
  function split5050(title: string, disc: string, bg: string, tc: string, imgUrl: string, videoUrl: string, imgSide: 'left' | 'right') {
    const sec = add('div', page, {
      name: (title || 'Split').slice(0, 20),
      style: { ...rel, width: 'auto', height: 'auto', backgroundColor: bg, borderRadius: 0, border: 'none' },
      layoutMode: 'flex',
      layoutProps: { direction: 'row', gap: 0, ...noPad, alignItems: 'stretch' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (!sec) return
    const mediaEl = () => {
      if (imgUrl) {
        add('image', sec, {
          name: 'Visual',
          style: { ...rel, width: 720, height: 500, objectFit: 'cover' },
          props: { src: imgUrl.startsWith('//') ? 'https:' + imgUrl : imgUrl, alt: title || '' },
          sizing: { w: 'fill', h: 'fill' },
        })
      } else if (videoUrl) {
        const vSrc = videoUrl.startsWith('//') ? 'https:' + videoUrl : videoUrl
        add('video', sec, {
          name: 'Video',
          style: { ...rel, width: 720, height: 500, objectFit: 'cover' },
          props: { src: vSrc, autoplay: true, muted: true, loop: true, controls: false },
          sizing: { w: 'fill', h: 'fill' },
        })
      }
    }
    const textEl = () => {
      const textCol = add('div', sec, {
        name: 'Text Col',
        style: { ...rel, width: 'auto', height: 'auto', ...box },
        layoutMode: 'flex',
        layoutProps: { direction: 'column', gap: 16, paddingTop: PAD_NRML, paddingRight: 60, paddingBottom: PAD_NRML, paddingLeft: 60, alignItems: 'start', justifyContent: 'center' },
        sizing: { w: 'fill', h: 'hug' },
      })
      if (!textCol) return
      if (title) {
        add('text', textCol, {
          name: 'Title',
          style: { ...rel, fontSize: TITLE_SIZE, fontWeight: 700, color: tc || '#000000', lineHeight: 1.17 },
          props: { content: title },
        })
      }
      if (disc) {
        add('text', textCol, {
          name: 'Desc',
          style: { ...rel, fontSize: DESC_SIZE, color: bg === '#000000' ? '#d4d4d4' : '#000000', lineHeight: 1.88 },
          props: { content: disc },
        })
      }
    }
    if (imgSide === 'left') { mediaEl(); textEl() }
    else { textEl(); mediaEl() }
  }

  /** feature-full-bleed: 풀너비 이미지 */
  function fullBleed(bg: string, imgUrl: string) {
    const src = imgUrl.startsWith('//') ? 'https:' + imgUrl : imgUrl
    const sec = add('div', page, {
      name: 'Full Bleed',
      style: { ...rel, width: 'auto', height: 'auto', backgroundColor: bg, borderRadius: 0, border: 'none' },
      layoutMode: 'flex',
      layoutProps: { direction: 'column', gap: 0, ...noPad, alignItems: 'center' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (!sec) return
    add('image', sec, {
      name: 'Bleed Image',
      style: { ...rel, width: W, height: 700, objectFit: 'cover' },
      props: { src, alt: '' },
      sizing: { w: 'fill', h: 'fill' },
    })
  }

  // ════════════════════════════════════════════
  // Hero KV
  // ════════════════════════════════════════════
  const heroSection = add('div', page, {
    name: 'Hero KV',
    style: { ...rel, width: 'auto', height: 810, ...box, overflow: 'hidden' },
    sizing: { w: 'fill', h: 'fixed' },
  })
  if (heroSection) {
    add('image', heroSection, {
      name: 'Hero BG',
      style: { ...rel, width: W, height: 810, objectFit: 'cover' },
      props: { src: 'https://images.samsung.com/kdp/static/pd/smartphone/pd-kv-galaxy-z-fold7-pc-kv-img.jpg', alt: '블루 쉐도우 색상의 갤럭시 Z 폴드7' },
      sizing: { w: 'fill', h: 'fill' },
    })
  }

  // ════════════════════════════════════════════
  // Component 0: Disclaimer
  // ════════════════════════════════════════════
  textSimple('',
    '* 특정 AI 기능 사용을 위해서는 삼성 계정 로그인이 필요합니다.\n* 삼성은 AI 기능 결과의 정확성, 완성도, 신뢰성에 대해 보장하지 않습니다.\n* Galaxy AI 기능의 사용 가능 여부는 지역/국가, OS/One UI 버전, 기기 모델, 이동통신사에 따라 다를 수 있습니다.\n* 삼성 갤럭시 기기의 Galaxy AI 기본 기능들은 무료로 제공되나, 향후 출시되는 향상된 기능이나 새로운 서비스는 유료로 제공될 수 있습니다.\n* 일부 지역에서는 AI 이용 연령 제한이 있어 미성년자에게 Galaxy AI 서비스가 제한될 수 있습니다.\n* 이해를 돕기 위해 연출된 이미지입니다. 실제 UX/UI는 다를 수 있습니다.',
    '#ffffff', '')

  // ════════════════════════════════════════════
  // Component 1: 갤럭시 Z 폴드7, 울트라를 펼치다 (video)
  // ════════════════════════════════════════════
  imgBottom('갤럭시 Z 폴드7,\n울트라를 펼치다', '', '#ffffff', '#000000', '',
    'https://images.samsung.com/kdp/cms_task/C20250716000009/35173/3e35d3a2-8b51-46ea-b2da-9aba8c76836e.mp4')

  // ════════════════════════════════════════════
  // Component 2: Marketing copy (stc)
  // ════════════════════════════════════════════
  stcText(
    '역대 갤럭시 Z 폴드 중에서\n가장 슬림하고 가볍게 설계된 혁신적인 디자인의 갤럭시 Z 폴드7을 만나보세요.\n더 넓어진 디스플레이들을 통해 놀라운 몰입감을 경험해보세요.\n이제 울트라급 경험을 폴드에서 더 크게 펼쳐보세요.',
    '#ffffff', '#000000')

  // ════════════════════════════════════════════
  // Component 3: Disclaimer
  // ════════════════════════════════════════════
  textSimple('', '* 이전 갤럭시 Z 폴드 시리즈와 비교한 결과입니다.', '#ffffff', '')

  // ════════════════════════════════════════════
  // Component 4: 놀랍도록 얇고 가벼운 디자인
  // ════════════════════════════════════════════
  imgBottom('놀랍도록 얇고 가벼운 디자인', '', '#ffffff', '#000000',
    '//images.samsung.com/kdp/cms_task/C20250625010033/34179/def1e6e4-1091-479d-a360-01456fc2f566.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 5: Thinnest stc
  // ════════════════════════════════════════════
  stcText(
    '스마트폰에 대한 기대를 뛰어넘는 놀라운 갤럭시 Z 폴드7을 만나보세요.\n접은 상태로 사용할 때에는 21:9 비율로 재탄생한 커버 디스플레이와\n더욱 더 얇아진 디자인의 조합으로 한 손으로 더 쉽고 편안하게 사용할 수 있죠.\n더 넓은 화면에서의 몰입이 필요할 땐 역대 가장 큰 203.1mm의 메인 디스플레이를 펼쳐보세요.',
    '#ffffff', '#000000')

  // ════════════════════════════════════════════
  // Component 6: Thinnest disclaimer
  // ════════════════════════════════════════════
  textSimple('',
    '* 이해를 돕기 위해 연출된 이미지 입니다.\n* 이전 갤럭시 Z 폴드 시리즈와 비교한 결과입니다.\n* 갤럭시 Z 폴드7의 커버 디스플레이 크기는 대각선 측정 시 164.8mm입니다.\n* 갤럭시 Z 폴드7의 메인 디스플레이 크기는 대각선 측정 시 203.1mm입니다.',
    '#ffffff', '')

  // ════════════════════════════════════════════
  // Component 7: 매력적인 컬러로 완성된 놀라운 디자인
  // ════════════════════════════════════════════
  imgBottom('매력적인 컬러로 완성된 놀라운 디자인',
    '* 이해를 돕기 위해 연출된 이미지 입니다.\n* 색상은 국가, 이동통신사에 따라 다를 수 있습니다.\n* 삼성닷컴/삼성 강남 전용컬러 제품은 오직 삼성닷컴과 삼성 강남에서만 구매할 수 있습니다.',
    '#ffffff', '#000000',
    '//images.samsung.com/kdp/cms_task/C20250625010036/34182/f422b0b2-3eff-4f09-bc30-a3612bd6ea22.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 8: 얇지만 더욱 강력해진 내구성
  // ════════════════════════════════════════════
  imgBottom('얇지만 더욱 강력해진 내구성',
    '* 이해를 돕기 위해 연출된 이미지 입니다.\n* 이전 갤럭시 Z 폴드 시리즈와 비교한 결과입니다.\n* 어드밴스드 아머 알루미늄 프레임은 볼륨 버튼, 사이드 키, SIM 트레이를 포함하지 않습니다.\n* 기기 전면에는 코닝® 고릴라® 글래스 세라믹 2가 후면에는 코닝® 고릴라® 글래스 빅터스® 2가 적용되었습니다.',
    '#ffffff', '#000000',
    '//images.samsung.com/kdp/cms_task/C20250829000273/36317/59418458-bd93-48eb-bcb9-a1e2474d3e85.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 9: Thin & light comparison
  // ════════════════════════════════════════════
  imgBottom('',
    '* 갤럭시 Z 폴드4와 비교한 결과입니다.\n* 무게는 국가, 이동통신사에 따라 다를 수 있습니다.\n* 접힌 상태 두께는 커버 디스플레이부터 후면 글래스까지 측정한 값입니다.',
    '#ffffff', '',
    '//images.samsung.com/kdp/cms_task/C20250715000220/35139/f3773507-f687-4c02-be1d-1c84fa7416c5.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 10: Ultra Camera hero (dark) — 1440x846 원본 비율
  // ════════════════════════════════════════════
  imgBottom('', '', '#000000', '',
    '//images.samsung.com/kdp/cms_task/C20250625010040/34186/a381670c-7776-43d6-9043-608bda89450f.jpg?$FB_TYPE_A_JPG$', '', 846)

  // ════════════════════════════════════════════
  // Component 11: 압도적인 2억 화소 카메라 (title + desc)
  // ════════════════════════════════════════════
  textSimple('갤럭시 Z 폴드7에서 만나는\n압도적인 2억 화소 카메라',
    '강력한 2억 화소 카메라와 ProVisual Engine의 완벽한 조합으로\n놀랍도록 아름다운 초고해상도 사진을 촬영해 보세요.\n갤럭시 Z 폴드 시리즈 최초로 탑재된 2억 화소 카메라는\n모든 순간을 디테일하게 포착하고, 차세대 ProVisual Engine이\n색상과 디테일을 개선하여 선명도를 높이고 피부톤과 질감까지 더욱 선명하게 표현해주죠.',
    '#000000', '#ffffff')

  // ════════════════════════════════════════════
  // Component 12: Camera specs
  // ════════════════════════════════════════════
  imgBottom('',
    '* 이전 갤럭시 Z 폴드 시리즈와 비교한 결과입니다.\n* 조명 조건, 피사체의 수, 초점이 맞지 않거나 움직이는 등 촬영 조건에 따라 결과는 달라질 수 있습니다.\n* \'광학 줌 수준\'은 적응형 픽셀 센서를 기반으로 한 스페이스 줌입니다.',
    '#000000', '',
    '//images.samsung.com/kdp/cms_task/C20250625010042/34188/9ce80f57-3c44-4760-8407-570996be7850.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 14: Camera Compare
  // ════════════════════════════════════════════
  imgBottom('', '* 갤럭시 Z 폴드4와 비교한 결과입니다.',
    '#000000', '',
    '//images.samsung.com/kdp/cms_task/C20250701010001/34290/7709ac6e-9a5c-4f11-be7f-89de66b37ebf.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 15: 어두운 곳에서도 선명한 영상 촬영 (video)
  // ════════════════════════════════════════════
  imgBottom('어두운 곳에서도 선명한 영상 촬영', '',
    '#000000', '#ffffff', '',
    'https://images.samsung.com/kdp/cms_task/C20250716000011/35175/e6b16c8d-5ee9-44eb-a532-a111f5ff170b.mp4')

  // ════════════════════════════════════════════
  // Component 16: Dark video image
  // ════════════════════════════════════════════
  imgBottom('', '', '#000000', '',
    '//images.samsung.com/kdp/cms_task/C20250716000007/35171/16969e6b-58d4-4b55-b1aa-4b7198c75a47.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 17: Dark video stc
  // ════════════════════════════════════════════
  stcText(
    '저조도에서도 놀랍도록 또렷한 영상을 촬영해 보세요.\n고성능 센서와 AP에 내장된 향상된 ProVisual Engine의 조합으로\n낮에도 밤에도 풍부한 명암비로 디테일까지 생생하게 촬영할 수 있죠.\n또한, 노이즈를 줄여 영상을 따로 보정하지 않아도 어둠 속에서 선명한 영상을 담아낼 수 있습니다.',
    '#000000', '#d4d4d4')

  // ════════════════════════════════════════════
  // Component 18: Dark video disclaimer
  // ════════════════════════════════════════════
  textSimple('',
    '* 이전 갤럭시 Z 폴드 시리즈와 비교한 결과입니다.\n* 조명 조건, 피사체의 수, 초점이 맞지 않거나 움직이는 등 촬영 조건에 따라 결과는 달라질 수 있습니다.',
    '#000000', '')

  // ════════════════════════════════════════════
  // Component 19: 전문가처럼 촬영하고 (split left)
  // ════════════════════════════════════════════
  split5050('전문가처럼 촬영하고\n대화면에서 편집까지',
    '갤럭시 Z 폴드7의 대화면 메인 디스플레이에서는\n2억 화소 카메라로 촬영한 결과물을 넓게 펼쳐\n디테일까지 놓치지 않고 편집할 수 있죠.\n촬영에서 편집과 공유까지, 한 번에 쉽게 이루어집니다.',
    '#000000', '#ffffff',
    '//images.samsung.com/kdp/cms_task/C20250625010046/34192/ebe00691-1af6-4937-82a1-f0431f9badb8.jpg?$FB_TYPE_B_JPG$', '', 'left')

  // ════════════════════════════════════════════
  // Component 20: 몰입감은 높이고 (video)
  // ════════════════════════════════════════════
  imgBottom('몰입감은 높이고, 불편한 소음은 낮추고', '',
    '#000000', '#ffffff', '',
    'https://images.samsung.com/kdp/cms_task/C20250829000275/36319/ba0ba515-aaa5-42c2-b317-8dbb8edbb9d1.mp4')

  // ════════════════════════════════════════════
  // Component 21: Audio eraser stc
  // ════════════════════════════════════════════
  stcText(
    '오디오 지우개로 영상 속 원치 않는 배경 소음을 깔끔하게 제거해 보세요.\nGalaxy AI가 갤러리에서 단 한 번의 탭으로 오디오를 감지하고 미세 조정까지 완료하죠.\n삼성 노트, 비디오 플레이어, 음성 녹음 등 더 많은 앱에서 사용할 수 있어 한층 편리해졌습니다.',
    '#000000', '#d4d4d4')

  // ════════════════════════════════════════════
  // Component 22: Audio eraser disclaimer
  // ════════════════════════════════════════════
  textSimple('',
    '* 이전 갤럭시 Z 폴드 시리즈와 비교한 결과입니다.\n* 오디오 지우개의 결과는 영상 내 존재하는 소리에 따라 결과는 다를 수 있습니다.',
    '#000000', '')

  // ════════════════════════════════════════════
  // Component 23: 더 넓어진 화각 (split right)
  // ════════════════════════════════════════════
  split5050('더 넓어진 화각으로\n더 많은 사람과 함께, 찰칵',
    '메인 디스플레이의 한층 더 업그레이드된 천만 화소 카메라로\n더 많은 사람들과 함께 셀피를 남겨보세요.\n또렷하고 선명해진 화질로 생동감 넘치는 순간을 촬영하고,\n넓어진 화각으로 더 많은 사람과 멋진 배경을 한 번에 담을 수 있죠.',
    '#000000', '#ffffff',
    '//images.samsung.com/kdp/cms_task/C20250829000270/36314/ae84d069-c60b-47b0-b49a-7cbbd7274440.jpg?$FB_TYPE_B_JPG$', '', 'right')

  // ════════════════════════════════════════════
  // Component 24: 슬림한 바디에 압도적인 강력함
  // ════════════════════════════════════════════
  imgBottom('슬림한 바디에\n압도적인 강력함', '',
    '#000000', '#ffffff',
    '//images.samsung.com/kdp/cms_task/C20250625010048/34194/98b743c4-c0f1-4ec9-9487-bb5d21b41419.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 25: Processor description
  // ════════════════════════════════════════════
  textSimple('',
    '갤럭시 Z 폴드7의 역대급 대화면과 강력해진 갤럭시용 스냅드래곤® 모바일 프로세서로 몰입감 넘치는 게이밍 경험을 즐겨보세요.\n차세대 프로세서는 CPU, GPU, NPU 성능이 모두 놀랍도록 향상되어 압도적 게이밍 경험과 AI 성능을 완성합니다.\nVulkan 최적화로 몰입감이 강화되고 실시간 레이 트레이싱으로 장면마다 생동감이 넘치는 그래픽을 즐길 수 있죠.',
    '#000000', '#d4d4d4')

  // ════════════════════════════════════════════
  // Component 26: AP Performance specs
  // ════════════════════════════════════════════
  imgBottom('',
    '* 이전 갤럭시 Z 폴드 시리즈와 비교한 결과입니다.\n* 스냅드래곤(Snapdragon)은 Qualcomm Technologies, Inc 및 그 자회사의 제품입니다.\n* AP 성능 관련 수치는 자사 실험을 기준으로 측정된 값입니다.',
    '#000000', '',
    '//images.samsung.com/kdp/cms_task/C20250625010050/34196/c7c9b70a-30d2-4a45-a4aa-e1fba8aa6bd2.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 27: 배터리 (split right)
  // ════════════════════════════════════════════
  split5050('종일 집중할 수 있는\n대용량, 고효율 배터리',
    '외출 중에도 배터리 걱정 없이 게임, 동영상 시청, 멀티태스킹을 즐겨보세요.\n넉넉한 4,400mAh 용량과 모바일에 최적화된\nmDNle 기술로 배터리 소모를 줄여 최대 전력 효율을 자랑합니다.',
    '#000000', '#ffffff',
    '//images.samsung.com/kdp/cms_task/C20250625010051/34197/d368cfa3-1b00-4fa9-9ea8-d070b8dec353.jpg?$FB_TYPE_B_JPG$', '', 'right')

  // ════════════════════════════════════════════
  // Component 28: Battery Compare
  // ════════════════════════════════════════════
  imgBottom('',
    '* 갤럭시 Z 폴드4와 비교한 결과입니다.',
    '#000000', '',
    '//images.samsung.com/kdp/cms_task/C20250701010002/34291/4a4892cb-46c0-42d6-bd06-619f1759d371.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 29: 저장 공간 (split left)
  // ════════════════════════════════════════════
  split5050('필요한 모든 것을 위한\n넉넉한 저장 공간',
    '12GB, 16GB 메모리와 함께 256GB, 512GB, 1TB의\n3가지 저장 공간 옵션을 제공합니다.\n용도에 맞게 자유롭게 선택해 보세요.',
    '#000000', '#ffffff',
    '//images.samsung.com/kdp/cms_task/C20250625010053/34199/1733d3a5-b587-4aa8-ba24-40ac77553cc6.jpg?$FB_TYPE_B_JPG$', '', 'left')

  // ════════════════════════════════════════════
  // Component 30: Galaxy AI full bleed
  // ════════════════════════════════════════════
  fullBleed('#ffffff',
    '//images.samsung.com/kdp/cms_task/C20250625010055/34201/cec0bb3f-2b82-4da4-abdc-52b8f43d265b.jpg?$ORIGIN_JPG$')

  // ════════════════════════════════════════════
  // Component 31: 한 화면에서 원본과 나란히 비교 (video)
  // ════════════════════════════════════════════
  imgBottom('한 화면에서 원본과 나란히 비교하며\n디테일하게 편집해보세요', '',
    '#ffffff', '#000000', '',
    'https://images.samsung.com/kdp/cms_task/C20250829000269/36313/8ab3744a-5e8b-4fe3-bb6b-f505fc71601a.mp4')

  // ════════════════════════════════════════════
  // Component 32: Photo Assist stc
  // ════════════════════════════════════════════
  stcText(
    '포토 어시스트의 원본과 수정본을 나란히 보는 기능으로\n한 화면에서 두 가지 버전을 비교하면서 사진을 편집할 수 있습니다.\n객체를 길게 눌러 이동, 삭제 또는 확대하거나 각도를 조정하고 배경을 채워보세요.',
    '#ffffff', '#000000')

  // ════════════════════════════════════════════
  // Component 33: Photo Assist disclaimer
  // ════════════════════════════════════════════
  textSimple('',
    '* 포토 어시스트의 생성형 편집 기능은 네트워크 연결 및 삼성 계정 로그인이 필요합니다.\n* 생성형 편집으로 편집하면 사진 크기가 최대 12MP로 조정됩니다.',
    '#ffffff', '')

  // ════════════════════════════════════════════
  // Component 34: 답이 필요할 땐 (video)
  // ════════════════════════════════════════════
  imgBottom('답이 필요할 땐\n언제든 물어보세요', '',
    '#ffffff', '#000000', '',
    'https://images.samsung.com/kdp/cms_task/C20250924000008/36767/db29016d-137c-4c40-a6e1-4520ed2e5662.mp4')

  // ════════════════════════════════════════════
  // Component 35: Gemini Live stc
  // ════════════════════════════════════════════
  stcText(
    '갤럭시 Z 폴드7에서 화면 공유를 사용하여 Gemini Live를 만나보세요.\n측면 버튼을 눌러 Gemini Live를 실행하고 자연스럽게 대화하며 실시간으로 정보를 얻어 보세요.\n카메라를 활용해 순간을 공유하며 다양한 의견과 아이디어를 바로 요청할 수 있습니다.',
    '#ffffff', '#000000')

  // ════════════════════════════════════════════
  // Component 36: Gemini disclaimer
  // ════════════════════════════════════════════
  textSimple('',
    '* Gemini는 Google LLC의 상표입니다.\n* 설명을 위해 연출된 예시 이미지로, 결과는 달라질 수 있습니다.\n* Gemini Live 사용 시 인터넷 연결 및 Google 계정 로그인이 필요합니다.\n* 서비스의 이용 가능 여부는 국가 및 언어, 기기 모델에 따라 다를 수 있습니다.',
    '#ffffff', '')

  // ════════════════════════════════════════════
  // Component 37: Gemini full bleed
  // ════════════════════════════════════════════
  fullBleed('#ffffff',
    '//images.samsung.com/kdp/cms_task/C20250725000120/35525/34e042b5-199d-4569-adac-7a068ff6421c.jpg?$ORIGIN_JPG$')

  // ════════════════════════════════════════════
  // Component 38: Google AI Pro image
  // ════════════════════════════════════════════
  imgBottom('',
    '* 이해를 돕기 위해 순서를 단축한 이미지입니다.',
    '#ffffff', '',
    '//images.samsung.com/kdp/cms_task/C20250901000292/36336/19b54d12-e719-4563-9703-888106ef5284.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 39: Now Brief
  // ════════════════════════════════════════════
  imgBottom('나만을 위한 맞춤형 브리핑\nNow Brief', '',
    '#ffffff', '#000000',
    '//images.samsung.com/kdp/cms_task/C20250829000267/36311/61a0abb4-34f3-4205-87ed-940fe5de7dbd.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 40: Now Brief stc
  // ════════════════════════════════════════════
  stcText(
    '갤럭시 Z 폴드7의 대화면에서 Now Brief로 새로운 하루의 흐름을 확인해 보세요.\n더 커진 메인 디스플레이를 펼쳐서 최신 날씨와 에너지 점수 같은 맞춤형 정보를 한눈에 확인할 수 있습니다.',
    '#ffffff', '#000000')

  // ════════════════════════════════════════════
  // Component 41: Now Brief disclaimer
  // ════════════════════════════════════════════
  textSimple('',
    '* Now Brief 기능을 사용하려면 삼성 계정 로그인이 필요합니다.\n* 서비스의 이용 가능 여부는 국가 및 언어, 기기 모델, 앱에 따라 다를 수 있습니다.',
    '#ffffff', '')

  // ════════════════════════════════════════════
  // Component 42: Galaxy AI 요약 정리 title
  // ════════════════════════════════════════════
  textSimple('Galaxy AI로 스마트하고 간편하게 요약 정리', '',
    '#ffffff', '#000000')

  // ════════════════════════════════════════════
  // Component 44: Galaxy AI disclaimer
  // ════════════════════════════════════════════
  textSimple('',
    '* 글쓰기 어시스트의 글쓰기 기능은 네트워크 연결 및 삼성 계정 로그인이 필요합니다.\n* 텍스트 변환 어시스트의 텍스트 변환 및 요약 기능은 네트워크 연결 및 삼성 계정 로그인이 필요합니다.',
    '#ffffff', '')

  // ════════════════════════════════════════════
  // Component 45: Privacy full bleed
  // ════════════════════════════════════════════
  fullBleed('#ffffff',
    '//images.samsung.com/kdp/cms_task/C20250625010067/34213/39c8ed3a-c5c2-4baf-b8ab-7efdbd6b4c64.jpg?$ORIGIN_JPG$')

  // ════════════════════════════════════════════
  // Component 46: AI 시대에 걸맞은 개인정보 보호
  // ════════════════════════════════════════════
  imgBottom('AI 시대에 걸맞은\n철저한 개인정보 보호',
    '* Personal Data Engine은 \'퍼스널 데이터 인텔리전스\' 메뉴가 켜져 있을 때만 작동합니다.\n* 현재 Personal Data Engine은 삼성 기본 앱 내에서만 데이터를 분석하고 있습니다.',
    '#ffffff', '#000000',
    '//images.samsung.com/kdp/cms_task/C20250625010068/34214/67317b31-3e4f-465c-bad7-9483ebf4bae5.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 47: One UI 8 (split left, video)
  // ════════════════════════════════════════════
  split5050('완전히 새로운\n갤럭시 Z 폴드7을 위해\n진화한 One UI 8',
    '사용자에게 최적화된 최고의 One UI 8을 만나보세요.\n더 커진 메인 디스플레이와 커버 디스플레이를 위해\n완전히 새롭게 설계했습니다.\n취향에 맞게 꾸밀 수 있는 맞춤형 배경화면과 반응형 날씨 및\n갤러리 위젯으로 나만을 위한 특별한 갤럭시 Z 폴드7을 완성할 수 있죠.',
    '#ffffff', '#000000', '',
    'https://images.samsung.com/kdp/cms_task/C20250924000012/36771/c2ba075e-ce85-4546-807e-14013d34e808.mp4', 'left')

  // ════════════════════════════════════════════
  // Component 48: 쓸수록 돋보이는 새로운 디자인 (split right, video)
  // ════════════════════════════════════════════
  split5050('쓸수록 돋보이는\n새로운 디자인',
    '갤럭시 Z 폴드7의 커버 디스플레이는 164.8mm로 더 넓어지고,\n바디는 더 슬림해져 그립감이 개선되고 타이핑은 더욱 자연스럽죠.\n이제 한 손으로도 쉽고 편하게 작업을 완료하세요.',
    '#ffffff', '#000000', '',
    'https://images.samsung.com/kdp/cms_task/C20250716000016/35180/b9d04fd4-8a4e-46d5-98f7-723e5aa37973.mp4', 'right')
}
