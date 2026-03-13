import type { DocumentStore } from "../../stores/DocumentStore"
import { createTemplateHelper } from "./helpers"

/**
 * Galaxy Z Flip7 Buy 페이지 특장점(bcFeatures) 섹션 — 실제 페이지 1:1 재현
 * 41개 wrap-component + Hero KV를 순서대로 배치
 */
export function buildGalaxyFlip(store: DocumentStore): void {
  const root = store.elements.get(store.rootId)
  if (!root) return

  const rel = { position: 'relative' as const, left: undefined, top: undefined }
  const noPad = { paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 }
  const add = createTemplateHelper(store)

  const box = { backgroundColor: 'transparent' as const, borderRadius: 0, border: 'none' }

  // Samsung computed styles
  const TITLE_SIZE = 46    // 46.22px
  const DESC_SIZE = 16
  const DISC_SIZE = 12     // 12.44px
  const PAD_NRML = 60      // pt-nrml / pb-nrml

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
  function imgBottom(title: string, disc: string, bg: string, tc: string, imgUrl: string, videoUrl: string) {
    const sec = add('div', page, {
      name: (title || 'Feature').slice(0, 20),
      style: { ...rel, width: 'auto', height: 'auto', backgroundColor: bg, borderRadius: 0, border: 'none' },
      layoutMode: 'flex',
      layoutProps: { direction: 'column', gap: 0, ...noPad, alignItems: 'center' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (!sec) return
    // Text area
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
    // Visual area
    if (imgUrl) {
      const src = imgUrl.startsWith('//') ? 'https:' + imgUrl : imgUrl
      add('image', sec, {
        name: 'Visual',
        style: { ...rel, width: W, height: 600, objectFit: 'cover' },
        props: { src, alt: title || 'Feature image' },
        sizing: { w: 'fill', h: 'fill' },
      })
    } else if (videoUrl) {
      const vSrc = videoUrl.startsWith('//') ? 'https:' + videoUrl : videoUrl
      add('video', sec, {
        name: 'Video',
        style: { ...rel, width: W, height: 600, objectFit: 'cover' },
        props: { src: vSrc, autoplay: true, muted: true, loop: true, controls: false },
        sizing: { w: 'fill', h: 'fill' },
      })
    }
    // 디스클레이머 (이미지 아래)
    if (disc && (imgUrl || videoUrl)) {
      add('text', sec, {
        name: 'Bottom Disc',
        style: { ...rel, fontSize: DISC_SIZE, color: bg === '#000000' ? '#666666' : '#888888', textAlign: 'center', lineHeight: 1.77, paddingTop: 16, paddingBottom: 16 },
        props: { content: disc },
      })
    }
  }

  /** feature-benefit img-left-5to5 / img-right-5to5: 50/50 분할 */
  function split5050(title: string, disc: string, bg: string, tc: string, imgUrl: string, _videoUrl: string, imgSide: 'left' | 'right') {
    const sec = add('div', page, {
      name: (title || 'Split').slice(0, 20),
      style: { ...rel, width: 'auto', height: 'auto', backgroundColor: bg, borderRadius: 0, border: 'none' },
      layoutMode: 'flex',
      layoutProps: { direction: 'row', gap: 0, ...noPad, alignItems: 'stretch' },
      sizing: { w: 'fill', h: 'hug' },
    })
    if (!sec) return
    const imgEl = () => {
      if (imgUrl) {
        add('image', sec, {
          name: 'Visual',
          style: { ...rel, width: 720, height: 500, objectFit: 'cover' },
          props: { src: imgUrl.startsWith('//') ? 'https:' + imgUrl : imgUrl, alt: title || '' },
          sizing: { w: 'fill', h: 'fill' },
        })
      } else if (_videoUrl) {
        const vSrc = _videoUrl.startsWith('//') ? 'https:' + _videoUrl : _videoUrl
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
          name: 'Disc',
          style: { ...rel, fontSize: DISC_SIZE, color: '#888888', lineHeight: 1.77 },
          props: { content: disc },
        })
      }
    }
    if (imgSide === 'left') { imgEl(); textEl() }
    else { textEl(); imgEl() }
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
      props: { src: 'https://images.samsung.com/kdp/static/pd/smartphone/pd-kv-galaxy-z-flip7-pc-kv-img-v2.jpg', alt: '블루 쉐도우 색상의 갤럭시 Z 플립7' },
      sizing: { w: 'fill', h: 'fill' },
    })
  }

  // ════════════════════════════════════════════
  // Component 0: Disclaimer
  // ════════════════════════════════════════════
  textSimple('',
    '* 특정 AI 기능 사용을 위해서는 삼성 계정 로그인이 필요합니다.\n* 삼성은 AI 기능 결과의 정확성, 완성도, 신뢰성에 대해 보장하지 않습니다.\n* Galaxy AI 기능의 사용 가능 여부는 지역/국가, OS/One UI 버전, 기기 모델, 이동통신사에 따라 다를 수 있습니다.\n* 삼성 갤럭시 기기의 Galaxy AI 기본 기능들은 무료로 제공되나, 향후 출시되는 향상된 기능이나 새로운 서비스는 유료로 제공될 수 있습니다. 제3자가 제공하는 AI 기능에는 다른 조건이 적용될 수 있습니다. Galaxy AI 기본 기능은 현재 삼성 서비스 이용 약관 내 \'Advanced Intelligence\' 항목에 나열된 서비스입니다.\n* 일부 지역에서는 AI 이용 연령 제한이 있어 미성년자에게 Galaxy AI 서비스가 제한될 수 있습니다.\n* 이해를 돕기 위해 연출된 이미지입니다. 실제 UX/UI는 다를 수 있습니다.\n* 플렉스모드를 지원하는 각도는 75˚~115˚입니다. 각도가 일정 범위를 벗어날 경우 제품이 완전히 펼쳐지거나 접힐 수 있습니다.',
    '#ffffff', '')

  // ════════════════════════════════════════════
  // Component 1: AI폰, 한 손에 쏙 (video)
  // ════════════════════════════════════════════
  imgBottom('AI폰, 한 손에 쏙', '', '#ffffff', '#000000', '',
    'https://images.samsung.com/kdp/cms_task/C20250716000075/35239/16b009c4-9b62-43ab-bed1-5ef11c965626.mp4')

  // ════════════════════════════════════════════
  // Component 2: Marketing copy (stc)
  // ════════════════════════════════════════════
  stcText(
    '지금껏 본 적 없는 최상의 슬림함과 강력한 내구성까지 지닌 갤럭시 Z 플립을 만나보세요.\n다양한 라이프스타일 속에서 발휘되는 뛰어난 성능과\n주머니에 쏙 들어가는 사이즈의 아름답고 콤팩트한 디자인이 강점이죠.\n더욱 넓어진 커버 디스플레이는 몰입감을 높여주고\n접었을 때와 펼쳤을 때 모두 슬림해진,\n매력 넘치는 갤럭시 Z 플립7을 소개합니다.',
    '#ffffff', '#000000')

  // ════════════════════════════════════════════
  // Component 3: Disclaimer
  // ════════════════════════════════════════════
  textSimple('', '* 이전 갤럭시 Z 플립 시리즈와 비교한 결과입니다.', '#ffffff', '')

  // ════════════════════════════════════════════
  // Component 4: 놀랍도록 얇고 콤팩트한 디자인 (title only)
  // ════════════════════════════════════════════
  textSimple('놀랍도록 얇고\n콤팩트한 디자인',
    '갤럭시 Z 플립 시리즈 사상 가장 슬림한 베젤을 품은 갤럭시 Z 플립7을 소개합니다.\n이제 완전히 새로워진 커버 디스플레이에서 그 어느 때보다 다양한 기능을 마음껏 즐겨보세요.\n그리고 플립을 펼치면, 끊김 없이 연결되는 놀라운 화면이 메인 디스플레이에서 펼쳐지죠.',
    '#ffffff', '#000000')

  // ════════════════════════════════════════════
  // Component 5: Ultra sleek (image)
  // ════════════════════════════════════════════
  imgBottom('', '* 이전 갤럭시 Z 플립 시리즈와 비교한 결과입니다.', '#ffffff', '',
    '//images.samsung.com/kdp/cms_task/C20250624010007/34087/f271d1a8-3824-418d-ba1f-61c60dfe905f.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 6: 시선을 사로잡는 강렬한 라인업
  // ════════════════════════════════════════════
  imgBottom('시선을 사로잡는 강렬한 라인업',
    '* 색상은 국가, 이동통신사에 따라 다를 수 있습니다.\n* 삼성닷컴/삼성 강남 전용컬러 제품은 오직 삼성닷컴과 삼성 강남에서만 구매할 수 있습니다.',
    '#ffffff', '#000000',
    '//images.samsung.com/kdp/cms_task/C20250624010008/34088/2fcd4133-6ae8-4ae7-bc58-7d5f0782e34a.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 7: 가장 얇고 튼튼한 갤럭시 Z 플립7
  // ════════════════════════════════════════════
  imgBottom('가장 얇고 튼튼한 갤럭시 Z 플립7',
    '* 이해를 돕기 위해 연출된 이미지 입니다.\n* 이전 갤럭시 Z 플립 시리즈와 비교한 결과입니다.\n* 아머 알루미늄 프레임은 볼륨 버튼, 사이드 키, SIM 트레이를 포함하지 않습니다.\n* 코닝® 고릴라® 글래스 빅터스® 2는 기기 전면과 후면에 적용되었습니다.',
    '#ffffff', '#000000',
    '//images.samsung.com/kdp/cms_task/C20250710000139/35058/e90dd3b4-c770-4249-8995-bfdec2286bcb.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 8: Design upgrades comparison
  // ════════════════════════════════════════════
  imgBottom('', '* 갤럭시 Z 플립4와 비교한 결과입니다.\n* 펼친 상태 두께는 글래스의 상단부터 하단까지 측정한 값입니다.\n* 갤럭시 Z 플립7의 커버 디스플레이(플렉스윈도우) 크기는 코너 곡선을 제외하고 직각화하여 대각선으로 측정 시 104.8mm, 직각화하지 않고 측정 시 102.3mm입니다.\n* 갤럭시 Z 플립4의 커버 디스플레이(플렉스윈도우) 크기는 코너 곡선을 제외하고 직각화하여 대각선으로 측정 시 48.2mm, 직각화하지 않고 측정 시 46.0mm입니다.\n* 둥근 모서리와 카메라 홀로 인해 실제 보이는 영역은 디스플레이 크기보다 작습니다.',
    '#ffffff', '',
    '//images.samsung.com/kdp/cms_task/C20250715000216/35135/ff492712-0d95-4226-b816-d41b332c7554.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 9: 5천만 화소로 담는 고화질 셀피
  // ════════════════════════════════════════════
  imgBottom('5천만 화소로 담는\n고화질 셀피', '',
    '#ffffff', '#000000',
    '//images.samsung.com/kdp/cms_task/C20250725000116/35521/9118f6cb-fd80-46a2-9d60-a8c2ab5e19ad.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 10: Camera stc description
  // ════════════════════════════════════════════
  stcText(
    '더 넓어진 플렉스윈도우에서 화면에 비춘 모습을 실시간으로 확인하며\n자연스럽고 풍부한 색감의 매력적인 셀피를 촬영해 보세요.\n5천만 화소의 고해상도 카메라가 미세한 부분까지 선명하게 포착하고\n차세대 ProVisual Engine이 색상은 물론 피부 톤과 질감까지 개선하여\n디테일한 아름다움을 선사하죠.\nAI 학습 기반의 맞춤형 필터를 사용하면 사진을 더욱 특별하게 완성할 수 있습니다.',
    '#ffffff', '#000000')

  // ════════════════════════════════════════════
  // Component 11: Camera disclaimer
  // ════════════════════════════════════════════
  textSimple('',
    '* 이전 갤럭시 Z 플립 시리즈와 비교한 결과입니다.\n* 조명 조건, 피사체의 수, 초점이 맞지 않거나 움직이는 피사체 등 촬영 조건에 따라 결과는 달라질 수 있습니다.\n* 5천만 화소는 갤럭시 Z 플립7의 후면 광각 카메라에서만 사용할 수 있습니다.',
    '#ffffff', '')

  // ════════════════════════════════════════════
  // Component 12: Camera MP specs
  // ════════════════════════════════════════════
  imgBottom('', '* \'광학 줌 수준\'은 적응형 픽셀 센서를 기반으로 한 스페이스 줌입니다.\n* \'광학 줌 수준\'의 배율은 광학 줌 배율을 의미하는 것이 아닙니다.',
    '#ffffff', '',
    '//images.samsung.com/kdp/cms_task/C20250624010066/34146/ff6ef278-1c9f-4ab2-b4ab-1130e62e3c46.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 13: Camera Compare
  // ════════════════════════════════════════════
  imgBottom('', '* 갤럭시 Z 플립4와 비교한 결과입니다.\n* 5천만 화소는 갤럭시 Z 플립7의 후면 광각 카메라에서만 사용할 수 있습니다.',
    '#ffffff', '',
    '//images.samsung.com/kdp/cms_task/C20250701010003/34292/2bb04e0d-7b75-4413-a170-146fdb8468b0.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 14: 멀리서도 선명하게 포착하는 디테일 (img-right)
  // ════════════════════════════════════════════
  split5050('멀리서도 선명하게\n포착하는 디테일',
    '* 이해를 돕기 위해 연출된 이미지 입니다. 실제 UX/UI는 다를 수 있습니다.\n* AI 줌은 디지털 줌 거리에 따라 적용되며, 결과의 정확성은 보장되지 않습니다. 자동 줌 기능은 플렉스모드에서 후면 카메라로 사용할 수 있으며, 줌을 수동으로 조정하면 해제됩니다. 저조도 조건에서는 제한됩니다.',
    '#ffffff', '#000000',
    '//images.samsung.com/kdp/cms_task/C20250624010015/34095/81306f64-ff44-47a0-832a-131030971b50.jpg?$FB_TYPE_B_JPG$', '', 'right')

  // ════════════════════════════════════════════
  // Component 15: 어두운 곳에서도 선명한 영상 촬영 (dark, video)
  // ════════════════════════════════════════════
  imgBottom('어두운 곳에서도 선명한 영상 촬영', '',
    '#000000', '#ffffff', '',
    'https://images.samsung.com/kdp/cms_task/C20250829000264/36308/bab421dc-9341-4248-909e-d64dde9ca2a2.mp4')

  // ════════════════════════════════════════════
  // Component 16: Full bleed dark image
  // ════════════════════════════════════════════
  fullBleed('#000000',
    '//images.samsung.com/kdp/cms_task/C20250716000037/35201/16c9e3c9-7dd4-48ef-85a0-1d19241cef54.jpg?$ORIGIN_JPG$')

  // ════════════════════════════════════════════
  // Component 17: 어두운 밤에도... (stc, dark)
  // ════════════════════════════════════════════
  stcText(
    '어두운 밤에도 숨 막힐 듯 아름다운 영상을 촬영해 보세요.\n강력한 프로세서로 향상된 ProVisual Engine과 고해상도 센서가 만나\n밤낮 없이 풍부한 대비감을 표현합니다.',
    '#000000', '#d4d4d4')

  // ════════════════════════════════════════════
  // Component 18: Dark disclaimer
  // ════════════════════════════════════════════
  textSimple('',
    '* 이전 갤럭시 Z 플립 시리즈와 비교한 결과입니다.\n* 조명 조건, 피사체의 수, 초점이 맞지 않거나 움직이는 피사체 등 촬영 조건에 따라 결과는 달라질 수 있습니다.',
    '#000000', '')

  // ════════════════════════════════════════════
  // Component 19: 역대 가장 빠르고 부드러운 (dark)
  // ════════════════════════════════════════════
  imgBottom('역대 가장 빠르고 부드러운\n갤럭시 Z 플립7', '',
    '#000000', '#ffffff',
    '//images.samsung.com/kdp/cms_task/C20250829000265/36309/86a06019-17c0-466b-af4c-0025ca7bd3bd.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 20: Processor description
  // ════════════════════════════════════════════
  stcText(
    '갤럭시 Z 플립7의 진화된 프로세서는 배터리부터 디스플레이까지,\n모든 영역을 필요한 순간마다 빠르고 안정적으로 구동시켜 줍니다.\n스트리밍, 게임, 영상 편집까지 원하는 모든 작업을 부드럽게.',
    '#ffffff', '#000000')

  // ════════════════════════════════════════════
  // Component 21: AP Performance specs
  // ════════════════════════════════════════════
  imgBottom('', '* AP 성능 관련 수치는 자사 실험을 기준으로 측정된 값입니다.\n* 전작 대비 AP 성능이 향상되었습니다.\n* 실제 성능은 사용자 환경, 조건, 사전에 설치된 소프트웨어 및 앱에 따라 달라집니다.',
    '#ffffff', '',
    '//images.samsung.com/kdp/cms_task/C20250624010018/34098/65977987-7823-4a8e-95bc-6428c1b6876f.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 22: 배터리 (img-left)
  // ════════════════════════════════════════════
  split5050('갤럭시 Z 플립 시리즈\n사상 가장 넉넉한 배터리',
    '* 이전 갤럭시 Z 플립 시리즈와 비교한 결과입니다.\n* 더 커진 4,300mAh 배터리 용량과 강력한 프로세서로 최적화된 mDNIe 기술로, 더 오랜 시간 좋아하는 콘텐츠를 끊김 걱정 없이 즐길 수 있습니다.',
    '#ffffff', '#000000',
    '//images.samsung.com/kdp/cms_task/C20250624010019/34099/5563fe91-6752-4fd9-9f2b-758eedcba2dd.jpg?$FB_TYPE_B_JPG$', '', 'left')

  // ════════════════════════════════════════════
  // Component 23: Battery life comparison
  // ════════════════════════════════════════════
  imgBottom('', '* 갤럭시 Z 플립4와 비교한 결과입니다.',
    '#ffffff', '',
    '//images.samsung.com/kdp/cms_task/C20250624010020/34100/9d2c3ad8-c68b-43e5-a9ef-48be9823ea87.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 24: 디스플레이 (img-right)
  // ════════════════════════════════════════════
  split5050('언제 어디서나\n선명한 디스플레이',
    '* 이전 갤럭시 Z 플립 시리즈와 비교한 결과입니다.\n* 갤럭시 Z 플립7의 메인 디스플레이 및 커버 디스플레이에서 최대 밝기(Peak Brightness)는 2,600nits입니다. 디스플레이는 환경에 따라 자동으로 밝기 수준을 조정하는 적응형입니다.',
    '#ffffff', '#000000',
    '//images.samsung.com/kdp/cms_task/C20250624010021/34101/cf256db9-a118-4fb7-81fe-bd8affc90ba3.jpg?$FB_TYPE_B_JPG$', '', 'right')

  // ════════════════════════════════════════════
  // Component 25: 저장 공간 (img-left)
  // ════════════════════════════════════════════
  split5050('필요한 모든 것을 위한\n넉넉한 저장 공간',
    '* 메모리 및 구매 가능한 스토리지 옵션은 국가, 지역, 이동통신사에 따라 달라질 수 있습니다.\n* 실제 사용 가능한 스토리지(저장 용량)는 미리 설치된 소프트웨어에 따라 다를 수 있습니다.',
    '#ffffff', '#000000',
    '//images.samsung.com/kdp/cms_task/C20250624010022/34102/c249329c-79f8-4be7-9176-8446b69b8d79.jpg?$FB_TYPE_B_JPG$', '', 'left')

  // ════════════════════════════════════════════
  // Component 26: Galaxy AI full bleed
  // ════════════════════════════════════════════
  fullBleed('#ffffff',
    '//images.samsung.com/kdp/cms_task/C20250624010023/34103/8b7ab602-4b5f-492a-9d87-4a348e8c8909.jpg?$ORIGIN_JPG$')

  // ════════════════════════════════════════════
  // Component 27: Now Brief (video)
  // ════════════════════════════════════════════
  imgBottom('Now Brief로 하루를\n시작해 보세요', '',
    '#ffffff', '#000000', '',
    'https://images.samsung.com/kdp/cms_task/C20250716000021/35185/957b0192-1c56-475e-9fcf-ad579b7fc2b6.mp4')

  // ════════════════════════════════════════════
  // Component 28: Now Brief stc
  // ════════════════════════════════════════════
  stcText(
    'Now Brief의 나만의 맞춤형 브리핑이 전하는 오늘의 일정을 커버 디스플레이에서 바로 확인하세요.\n최신 날씨나 에너지 점수와 같은 맞춤형 인사이트도 한눈에 확인할 수 있죠.',
    '#ffffff', '#000000')

  // ════════════════════════════════════════════
  // Component 29: Now Brief disclaimer
  // ════════════════════════════════════════════
  textSimple('',
    '* Now Brief 기능을 사용하려면 삼성 계정 로그인이 필요합니다.\n* 서비스의 이용 가능 여부는 국가 및 언어, 기기 모델, 앱에 따라 다를 수 있습니다.',
    '#ffffff', '')

  // ════════════════════════════════════════════
  // Component 30: Now Bar (img-left, video)
  // ════════════════════════════════════════════
  split5050('Now Bar로 실시간\n정보를 바로',
    '* 일부 위젯 기능을 사용하기 위해서는 네트워크 연결 및 삼성 계정 로그인이 필요할 수 있습니다.\n* 커버 디스플레이에서 Now Bar를 만나보세요. 지금 재생 중인 음악이나 실행 중인 타이머, 실시간 알림 등 필요한 정보를 즉시 확인해 보세요.',
    '#ffffff', '#000000', '',
    'https://images.samsung.com/kdp/cms_task/C20250716000025/35189/25129385-1869-42b3-8d17-c2606dff78a1.mp4', 'left')

  // ════════════════════════════════════════════
  // Component 31: Gemini Live (video)
  // ════════════════════════════════════════════
  imgBottom('답이 필요할 땐\n언제든 물어보세요', '',
    '#ffffff', '#000000', '',
    'https://images.samsung.com/kdp/cms_task/C20250829000266/36310/48e45d2e-36d7-40f1-a377-c483fa54d72f.mp4')

  // ════════════════════════════════════════════
  // Component 32: Go live full bleed
  // ════════════════════════════════════════════
  fullBleed('#ffffff',
    '//images.samsung.com/kdp/cms_task/C20250725000120/35525/34e042b5-199d-4569-adac-7a068ff6421c.jpg?$ORIGIN_JPG$')

  // ════════════════════════════════════════════
  // Component 33: Gemini stc description
  // ════════════════════════════════════════════
  stcText(
    '갤럭시 Z 플립7의 플렉스윈도우에서 Google Gemini를 만나보세요.\n측면 버튼을 눌러 Gemini Live를 실행하고\n자연스럽게 대화하며 실시간으로 정보를 얻어 보세요.\n카메라를 활용해 순간을 공유하며 다양한 의견과 아이디어를 바로 요청할 수 있습니다.',
    '#ffffff', '#000000')

  // ════════════════════════════════════════════
  // Component 34: Gemini disclaimer
  // ════════════════════════════════════════════
  textSimple('',
    '* Gemini는 Google LLC의 상표입니다.\n* 설명을 위해 연출된 예시 이미지로, 결과는 달라질 수 있습니다.\n* 서비스의 이용 가능 여부는 국가 및 언어, 기기 모델에 따라 다를 수 있습니다.\n* Gemini Live 사용시 인터넷 연결 및 Google 계정 로그인이 필요합니다. 기능 및 결과는 구독 여부에 따라 다를 수 있습니다.\n* 18세 이상 사용자에게만 제공됩니다. 결과의 정확성은 보장되지 않습니다.',
    '#ffffff', '')

  // ════════════════════════════════════════════
  // Component 35: Gemini image
  // ════════════════════════════════════════════
  imgBottom('', '* 이해를 돕기 위해 순서를 단축한 이미지입니다.',
    '#ffffff', '',
    '//images.samsung.com/kdp/cms_task/C20250901000292/36336/19b54d12-e719-4563-9703-888106ef5284.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 36: Privacy full bleed
  // ════════════════════════════════════════════
  fullBleed('#ffffff',
    '//images.samsung.com/kdp/cms_task/C20250624010027/34107/5c628526-a34e-4213-97ba-968779f5be45.jpg?$ORIGIN_JPG$')

  // ════════════════════════════════════════════
  // Component 37: AI 시대에 걸맞은 개인정보 보호
  // ════════════════════════════════════════════
  imgBottom('AI 시대에 걸맞은\n철저한 개인정보 보호',
    '* Personal Data Engine은 \'퍼스널 데이터 인텔리전스\' 메뉴가 켜져 있을 때만 작동합니다.\n* 개인 데이터 분석 및 활용은 온디바이스(기기 내)에서만 처리되며 외부 서버로 전송되지 않습니다.',
    '#ffffff', '#000000',
    '//images.samsung.com/kdp/cms_task/C20250624010028/34108/19640bbb-af64-4b06-89b9-5724cf39f904.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 38: One UI 8 image
  // ════════════════════════════════════════════
  imgBottom('', '',
    '#ffffff', '',
    '//images.samsung.com/kdp/cms_task/C20250624010029/34109/07617bdd-f8a8-4450-98e2-7b32dada6775.jpg?$FB_TYPE_A_JPG$', '')

  // ════════════════════════════════════════════
  // Component 39: One UI 8 stc
  // ════════════════════════════════════════════
  stcText(
    '사용자에게 최적화된 최고의 One UI 8을 만나보세요.\n갤럭시 Z 플립7의 메인 디스플레이와 커버 디스플레이를 위해\n완전히 새롭게 설계했습니다.\n취향에 맞게 꾸밀 수 있는 맞춤형 배경화면과 반응형 날씨 및 갤러리 위젯으로\n나만을 위한 특별한 갤럭시 Z 플립7을 완성할 수 있죠.',
    '#ffffff', '#000000')

  // ════════════════════════════════════════════
  // Component 40: One UI 8 disclaimer
  // ════════════════════════════════════════════
  textSimple('',
    '* 이해를 돕기 위해 연출된 이미지 입니다. 실제 UX/UI는 다를 수 있습니다.\n* 일부 위젯 기능을 사용하기 위해서는 네트워크 연결 및 삼성 계정 로그인이 필요할 수 있습니다.\n* 날씨 배경화면 기능은 날씨 데이터를 수신하기 위해 네트워크 연결이 필요합니다.\n* 특정 실내, 야간 및 저해상도 사진은 호환되지 않을 수 있습니다.',
    '#ffffff', '')
}
