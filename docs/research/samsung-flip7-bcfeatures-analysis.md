# Samsung Galaxy Z Flip7 - bcFeatures Section Analysis

**URL:** https://www.samsung.com/sec/smartphones/galaxy-z-flip7/buy/?modelCode=SM-F766NDBAKOD
**Target Element:** `<div class="tab_con bcFeatures">`
**Analysis Date:** 2026-03-13
**Total Content Size:** ~106KB / 105,665 characters

---

## Executive Summary

The bcFeatures section is a comprehensive product features showcase built with a **component-based architecture**. It uses:

- **Modular component system** with BEM-like naming (`wrap-component`, `component-contents`)
- **Responsive design** with separate mobile/desktop variants (`.mo-ver`, `.pc-ver`)
- **Lazy-loaded images** using `lozad` library
- **Inline styles** for colors and backgrounds (minimal external CSS dependency)
- **Semantic data attributes** for tracking (`data-cptnm`, `data-omni`)

---

## 1. Overall Architecture

### Container Structure

```html
<div class="tab_con bcFeatures">
  <article class="component-content component01 open" id="compGoodsFeatures">
    <div class="heightWrap" tabindex="0">
      <!-- Multiple wrap-component sections -->
    </div>
  </article>
</div>
```

### Component Hierarchy

1. **Root:** `.tab_con.bcFeatures` - Tab container
2. **Article:** `.component-content.component01.open` - Main content article
3. **Wrapper:** `.heightWrap` - Height management wrapper
4. **Components:** Multiple `.wrap-component` sections with different types

---

## 2. Component Types & Usage

### Component Distribution (39 total components)

| Component Type                   | Count | Usage                                     |
| -------------------------------- | ----- | ----------------------------------------- |
| `feature-benefit img-bottom`     | 17    | Product feature with bottom image         |
| `textbox-simple`                 | 9     | Text-only disclaimer/description sections |
| `textbox-simple stc-component`   | 6     | Styled text blocks (special formatting)   |
| `feature-benefit img-left-5to5`  | 3     | 50/50 split with image on left            |
| `feature-benefit img-right-5to5` | 2     | 50/50 split with image on right           |
| `feature-full-bleed`             | 4     | Full-width hero sections                  |

### Base Component Structure

All components follow this pattern:

```html
<div class="wrap-component [TYPE] new-component [SPACING] w1440px [LAYOUT]">
  <div class="component-contents [SPACING] [TEXT_ALIGN]" style="background-color:#FFFFFF" data-cptnm="[COMPONENT_NAME]">
    <div class="component-text">
      <div class="component-text-inner">
        <div class="box-title">
          <h2 class="title mo-ver" style="color:#000000">Mobile Title</h2>
          <h2 class="title pc-ver" style="color:#000000">Desktop Title</h2>
        </div>
        <div class="box-disc">
          <p class="disc mo-ver" style="color:#000000">Mobile disclaimer</p>
          <p class="disc pc-ver" style="color:#000000">Desktop disclaimer</p>
        </div>
      </div>
    </div>

    <div class="visual-area">
      <!-- Image or video content -->
    </div>
  </div>
</div>
```

---

## 3. Design System

### Color Palette

**Background Colors:**

- `#FFFFFF` - White (primary background)
- `#000000` - Black (hero sections, contrast backgrounds)

**Text Colors:**

- `#000000` - Black text (primary)
- `#FFFFFF` - White text (on dark backgrounds)
- `#d4d4d4` - Light gray (subtle text)

### Spacing Utilities

**Padding Top (pt-):**

- `pt-none` - No top padding
- `pt-nrml` - Normal top padding (~60-80px estimated)

**Padding Bottom (pb-):**

- `pb-none` - No bottom padding
- `pb-nrml` - Normal bottom padding (~60-80px estimated)

### Text Alignment

**Desktop (txt-):**

- `txt-top-center` - Top aligned, center
- `txt-top-left` - Top aligned, left
- `txt-mid-center` - Middle aligned, center
- `txt-mid-left` - Middle aligned, left

**Mobile (txtm-):**

- `txtm-top-center` - Mobile: top center
- `txtm-top-left` - Mobile: top left

### Layout Modifiers

**Image Position:**

- `img-bottom` - Image below text (most common)
- `img-left-5to5` - Image left, text right (50/50)
- `img-right-5to5` - Image right, text left (50/50)

**Container:**

- `w1440px` - Max width 1440px (all components)
- `fixWidth` - Fixed width container
- `new-component` - Marks newer component version

---

## 4. Responsive Strategy

### Device Breakpoint

- Desktop: `min-width: 801px`
- Mobile: `max-width: 800px`

### Dual-Content Pattern

Every text element is duplicated with device-specific classes:

```html
<!-- Mobile -->
<h2 class="title mo-ver" style="color:#000000">AI폰, 한 손에 쏙<br /></h2>

<!-- Desktop -->
<h2 class="title pc-ver" style="color:#000000">AI폰, 한 손에 쏙<br /></h2>
```

### Responsive Images

Uses `<picture>` with `<source>` elements:

```html
<picture class="stc-features-kv__picture">
  <source media="(min-width:801px)" srcset="//images.samsung.com/.../pc-kv-img-v2.jpg" />
  <source media="(max-width:800px)" srcset="//images.samsung.com/.../mo-kv-img-v2.jpg" />
  <img src="//images.samsung.com/.../pc-kv-img-v2.jpg" alt="..." />
</picture>
```

### Lazy Loading

Images use the `lozad` library:

```html
<img class="lozad obj-m" src="/sec/static/_images/common/img_baseimg_null.png" data-src="//images.samsung.com/kdp/.../image.jpg?$FB_TYPE_A_MO_JPG$" alt="..." />
```

---

## 5. Key Components Deep Dive

### 5.1 Hero KV (Key Visual)

**Component:** `stc-features-kv`

```html
<style>
  .stc-features-kv {
    position: relative;
    max-width: 1440px;
    margin: 0 auto;
  }
  .stc-features-kv__text-wrap {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding-top: 27%;
    padding-left: 67.5%;
  }
  .stc-features-kv__cta {
    display: block;
    width: 110px;
    height: 40px;
    border-radius: 20px;
  }
  @media (max-width: 1440px) {
    .stc-features-kv__cta {
      width: 7.6388vw;
      height: 2.7777vw;
      border-radius: 1.3888vw;
    }
  }
  @media (max-width: 800px) {
    .stc-features-kv__text-wrap {
      padding-top: 24.9%;
      padding-left: 0;
    }
    .stc-features-kv__cta {
      width: 29vw;
      height: 11.5vw;
      border-radius: 5.75vw;
      margin: 0 auto;
    }
  }
</style>

<section class="stc-features-kv">
  <div class="stc-features-kv__text-wrap">
    <div class="blind">
      <h2>Galaxy Z Flip7</h2>
      <p>Galaxy AI</p>
    </div>
    <a class="stc-features-kv__cta" href="https://www.samsung.com/sec/smartphones/galaxy-z-flip7/" aria-label="Galaxy Z Flip7 더 알아보기">
      <span class="blind">더 알아보기</span>
    </a>
  </div>
  <picture class="stc-features-kv__picture">
    <source media="(min-width:801px)" srcset="//images.samsung.com/.../pd-kv-galaxy-z-flip7-pc-kv-img-v2.jpg" />
    <source media="(max-width:800px)" srcset="//images.samsung.com/.../pd-kv-galaxy-z-flip7-mo-kv-img-v2.jpg" />
    <img class="stc-features-kv__img" src="//images.samsung.com/.../pd-kv-galaxy-z-flip7-pc-kv-img-v2.jpg" alt="블루 쉐도우 색상의 갤럭시 Z 플립7..." />
  </picture>
</section>
```

**Key Features:**

- Absolutely positioned text overlay (67.5% from left on desktop)
- Fluid CTA button sizing using viewport units
- Hidden text in `.blind` class for SEO/accessibility
- Clickable CTA area overlaid on image

---

### 5.2 Feature-Benefit Component

**Most Common:** 17 instances with `img-bottom` layout

```html
<div class="wrap-component feature-benefit new-component pt-none pb-none w1440px img-bottom">
  <div class="component-contents type-video pt-nrml pb-nrml txt-mid-center txtm-top-center" style="background-color:#FFFFFF" data-cptnm="Galaxy Z Flip7_AI Phone in One Hand">
    <div class="component-text">
      <div class="component-text-inner">
        <div class="box-title">
          <h2 class="title mo-ver" style="color:#000000">AI폰, 한 손에 쏙<br /></h2>
          <h2 class="title pc-ver" style="color:#000000">AI폰, 한 손에 쏙<br /></h2>
        </div>
      </div>
    </div>

    <div class="visual-area vdoDim">
      <script type="application/ld+json" data-type="seo" data-object-type="VideoObject">
        {
          "@context": "https://schema.org",
          "@type": "VideoObject",
          "name": "Galaxy Z Flip7_AI Phone in One Hand",
          "description": "갤럭시Z 플립7의 커버 디스플레이가 밝은 상태로 보입니다.",
          "thumbnailUrl": "https://images.samsung.com/kdp/noImage.jpg",
          "contentUrl": "https://images.samsung.com/.../video.mp4"
        }
      </script>

      <div class="video nonImg">
        <video id="videoLayer_2900381_vod" playsinline="">
          <source src="//images.samsung.com/.../video.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  </div>
</div>
```

**Features:**

- Supports both image and video content
- Structured data (JSON-LD) for SEO
- Custom video player script (`vodPlayer.create()`)
- Separate mobile/desktop text with optional line breaks

---

### 5.3 Textbox-Simple Component

**Usage:** Disclaimers, descriptions, legal text

```html
<div class="wrap-component textbox-simple new-component pt-none pb-none w1440px">
  <div class="component-contents pt-none pb-nrml txt-top-center txtm-top-center" style="background-color:#FFFFFF" data-cptnm="Galaxy Z Flip7_kv(text)">
    <div class="component-text">
      <div class="component-text-inner">
        <div class="box-title">
          <!-- Often empty for pure text blocks -->
        </div>
        <div class="box-disc">
          <p class="disc mo-ver" style="color:#000000">
            * 특정 AI 기능 사용을 위해서는 삼성 계정 로그인이 필요합니다.<br />
            * 삼성은 AI 기능 결과의 정확성, 완성도, 신뢰성에 대해 보장하지 않습니다.<br />
            <!-- More disclaimers... -->
          </p>
          <p class="disc pc-ver" style="color:#000000">
            * 특정 AI 기능 사용을 위해서는 삼성 계정 로그인이 필요합니다.<br />
            * 삼성은 AI 기능 결과의 정확성, 완성도, 신뢰성에 대해 보장하지 않습니다.<br />
            <!-- More disclaimers... -->
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Special Variant:** `.stc-component`

Used for styled text blocks with emphasis:

```html
<div class="wrap-component textbox-simple new-component pt-none pb-none w1440px stc-component">
  <div class="component-contents pt-nrml pb-nrml txt-top-center txtm-top-center" style="background-color:#FFFFFF">
    <div class="component-text">
      <div class="component-text-inner">
        <div class="box-title">
          <p class="desc mo-ver" style="color:#000000">
            지금껏 본 적 없는 <br />
            <strong>최상의 슬림함과 강력한 내구성</strong>까지 지닌<br />
            갤럭시 Z 플립을 만나보세요.<br />
            <!-- More marketing copy... -->
          </p>
          <p class="desc pc-ver" style="color:#000000">
            지금껏 본 적 없는 <strong>최상의 슬림함과 강력한 내구성</strong>까지 지닌 갤럭시 Z 플립을 만나보세요.<br />
            <!-- More marketing copy... -->
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

### 5.4 Feature-Full-Bleed Component

**Usage:** Full-width immersive sections (4 instances)

```html
<div class="wrap-component feature-full-bleed new-component pt-none pb-none w1440px">
  <div class="component-contents pt-nrml pb-nrml txt-mid-center txtm-top-center" style="background-color:#000000" data-cptnm="Component Name">
    <div class="component-text">
      <div class="component-text-inner">
        <div class="box-title">
          <h2 class="title mo-ver" style="color:#FFFFFF">Title Here</h2>
          <h2 class="title pc-ver" style="color:#FFFFFF">Title Here</h2>
        </div>
      </div>
    </div>

    <div class="visual-area">
      <!-- Full-width image or video -->
    </div>
  </div>
</div>
```

**Characteristics:**

- Often uses black background (`#000000`)
- White text for contrast
- Edge-to-edge visuals
- Dramatic impact sections

---

### 5.5 50/50 Split Layout Components

**Left Image (`img-left-5to5`):** 3 instances
**Right Image (`img-right-5to5`):** 2 instances

```html
<div class="wrap-component feature-benefit new-component pt-none pb-none w1440px img-left-5to5">
  <div class="component-contents pt-nrml pb-nrml txt-mid-left txtm-top-left" style="background-color:#FFFFFF" data-cptnm="Component Name">
    <!-- Text in one column, image in the other -->
    <div class="component-text">
      <!-- Text content -->
    </div>

    <div class="visual-area">
      <!-- Image content -->
    </div>
  </div>
</div>
```

**Layout Behavior:**

- Desktop: Side-by-side 50/50 columns
- Mobile: Stacks vertically (image likely above or below text)
- Text alignment changes: `txt-mid-left` vs `txt-mid-center`

---

## 6. Image Assets

### Image Naming Convention

Pattern: `https://images.samsung.com/kdp/cms_task/[TASK_ID]/[SUB_ID]/[GUID].[ext]?$[TRANSFORM]$`

**Image Transforms:**

- `$FB_TYPE_A_JPG$` - Desktop full-bleed image
- `$FB_TYPE_A_MO_JPG$` - Mobile full-bleed image
- `$FB_TYPE_B_JPG$` - Secondary image type
- `$ORIGIN_JPG$` - Original/untransformed image

### Total Images: 50 unique URLs

**Sample Image URLs:**

```
Desktop Hero:
//images.samsung.com/kdp/static/pd/smartphone/pd-kv-galaxy-z-flip7-pc-kv-img-v2.jpg

Mobile Hero:
//images.samsung.com/kdp/static/pd/smartphone/pd-kv-galaxy-z-flip7-mo-kv-img-v2.jpg

Product Features (Desktop):
https://images.samsung.com/kdp/cms_task/C20250624010007/34087/f271d1a8-3824-418d-ba1f-61c60dfe905f.jpg?$FB_TYPE_A_JPG$

Product Features (Mobile):
https://images.samsung.com/kdp/cms_task/C20250624010007/34087/cd21606c-4b3f-4da3-aaed-6714d7866145.jpg?$FB_TYPE_A_MO_JPG$
```

### Lazy Loading Implementation

**Placeholder:** `/sec/static/_images/common/img_baseimg_null.png`

**Pattern:**

```html
<img
  class="lozad obj-m"
  src="/sec/static/_images/common/img_baseimg_null.png"
  data-src="//images.samsung.com/kdp/.../actual-image.jpg?$FB_TYPE_A_MO_JPG$"
  alt="Descriptive alt text"
/>
```

**Object-fit classes:**

- `obj-m` - Object fit for mobile images

---

## 7. Video Components

### Video Player Integration

```html
<div class="visual-area vdoDim">
  <!-- SEO Structured Data -->
  <script type="application/ld+json" data-type="seo" data-object-type="VideoObject">
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "uploadDate": "2025-07-07T19:26:50.000+0900",
      "name": "Galaxy Z Flip7_AI Phone in One Hand",
      "description": "갤럭시Z 플립7의 커버 디스플레이가 밝은 상태로 보입니다.",
      "thumbnailUrl": "https://images.samsung.com/kdp/noImage.jpg",
      "contentUrl": "https://images.samsung.com/.../video.mp4"
    }
  </script>

  <!-- Video Element -->
  <div class="video nonImg">
    <video id="videoLayer_2900381_vod" playsinline="">
      <source src="//images.samsung.com/.../video.mp4" type="video/mp4" />
    </video>
  </div>

  <!-- Custom Player Script -->
  <script>
    vodPlayer.create("//images.samsung.com/.../video.mp4", "videoLayer_2900381_vod", "video", true)
  </script>
</div>
```

**Key Features:**

- JSON-LD structured data for SEO
- Custom `vodPlayer` initialization
- `playsinline` attribute for mobile
- Unique video ID for each instance

---

## 8. Component Names (data-cptnm)

**Purpose:** Analytics tracking, content management

**Examples:**

1. `Galaxy Z Flip7_kv(text)` - Key visual text
2. `Galaxy Z Flip7_AI Phone in One Hand` - Feature section
3. `Galaxy Z Flip7_Ultra sleek. Ultra pocketable` - Product benefit
4. `Galaxy Z Flip7_Bold colors fit for your style(General)` - Color showcase
5. `Galaxy Z Flip7_Our thinnest yet most durable Flip` - Durability feature
6. `Galaxy Z Flip7_Pro-level 50 MP camera` - Camera feature
7. `Galaxy Z Flip7_Max zoom. Min noise` - Camera capability
8. `Galaxy Z Flip7_Bring details out of the dark` - Low-light photography

**Naming Pattern:** `Product Name_Feature Description[(Category)]`

---

## 9. Accessibility Features

### Screen Reader Support

**Hidden Text Pattern:**

```html
<div class="blind">
  <h2>Galaxy Z Flip7</h2>
  <p>Galaxy AI</p>
</div>
```

`.blind` class: Visually hidden but accessible to screen readers

### ARIA Labels

```html
<a class="stc-features-kv__cta" href="..." aria-label="Galaxy Z Flip7 더 알아보기">
  <span class="blind">더 알아보기</span>
</a>
```

### Tab Navigation

```html
<div class="heightWrap" tabindex="0">
  <!-- Keyboard focusable container -->
</div>
```

---

## 10. Analytics & Tracking

### Data Attributes

**Component Tracking:**

```html
data-cptnm="Galaxy Z Flip7_AI Phone in One Hand"
```

**Omniture Tracking:**

```html
data-omni-type="microsite_contentinter" data-omni="pd:smartphones:galaxy_z_flip7:kv:view_more"
```

**Dynamic Insights:**

```html
data-di-id="di-id-f6c3ac13-3fa2636a"
```

---

## 11. CSS Class Reference

### Complete Class List (71 unique classes)

| Class                                                                                                    | Usage                      |
| -------------------------------------------------------------------------------------------------------- | -------------------------- |
| `alt-content`                                                                                            | Alternative content        |
| `award-box`, `award-item`, `award-list`                                                                  | Award display components   |
| `bcFeatures`                                                                                             | Root container             |
| `blind`                                                                                                  | Screen reader only content |
| `blk`                                                                                                    | Block element              |
| `box-article`, `box-disc`, `box-title`                                                                   | Content boxes              |
| `btn`, `btn-d`, `btn-type2`                                                                              | Button variants            |
| `btn_award_more`, `btn_detail_more`                                                                      | Specific action buttons    |
| `btn_moreview_close`, `btn_moreview_open`                                                                | Toggle buttons             |
| `col3`                                                                                                   | 3-column layout            |
| `component-con`, `component-content`, `component-contents`                                               | Component containers       |
| `component-text`, `component-text-inner`                                                                 | Text containers            |
| `component01`                                                                                            | Component type identifier  |
| `desc`                                                                                                   | Description text           |
| `detail_more`                                                                                            | Detail expansion           |
| `disc`                                                                                                   | Disclaimer text            |
| `feature-benefit`, `feature-full-bleed`                                                                  | Feature component types    |
| `fixWidth`                                                                                               | Fixed width container      |
| `heightWrap`                                                                                             | Height wrapper             |
| `img`, `img-bottom`, `img-left-5to5`, `img-right-5to5`                                                   | Image positioning          |
| `itm-notice`                                                                                             | Notice item                |
| `lozad`                                                                                                  | Lazy loading library class |
| `mo-ver`, `pc-ver`                                                                                       | Mobile/desktop visibility  |
| `moreview-box`                                                                                           | Expandable content box     |
| `new-component`                                                                                          | New component marker       |
| `nonImg`                                                                                                 | Non-image content          |
| `obj-m`                                                                                                  | Object-fit mobile          |
| `open`                                                                                                   | Open/expanded state        |
| `pb-none`, `pb-nrml`                                                                                     | Padding-bottom utilities   |
| `pt-none`, `pt-nrml`                                                                                     | Padding-top utilities      |
| `shadow-box`                                                                                             | Box with shadow            |
| `stc-component`                                                                                          | Special text component     |
| `stc-features-kv`                                                                                        | Key visual section         |
| `stc-features-kv__cta`, `stc-features-kv__img`, `stc-features-kv__picture`, `stc-features-kv__text-wrap` | KV sub-elements (BEM)      |
| `tab_con`                                                                                                | Tab container              |
| `title`                                                                                                  | Title element              |
| `txt-mid-center`, `txt-mid-left`, `txt-top-center`, `txt-top-left`                                       | Text alignment (desktop)   |
| `txtm-top-center`, `txtm-top-left`                                                                       | Text alignment (mobile)    |
| `type-video`                                                                                             | Video content type         |
| `vdoDim`                                                                                                 | Video dimension container  |
| `video`                                                                                                  | Video element              |
| `visual-area`                                                                                            | Visual content area        |
| `w1440px`                                                                                                | Max width 1440px           |
| `wrap-component`                                                                                         | Component wrapper          |

---

## 12. Typography Patterns

### Heading Structure

```html
<div class="box-title">
  <h2 class="title mo-ver" style="color:#000000">Mobile Heading<br /></h2>
  <h2 class="title pc-ver" style="color:#000000">Desktop Heading<br /></h2>
</div>
```

### Description Text

```html
<p class="desc mo-ver" style="color:#000000">Mobile description with <strong>emphasis</strong><br /></p>
<p class="desc pc-ver" style="color:#000000">Desktop description with <strong>emphasis</strong><br /></p>
```

### Disclaimer Text

```html
<div class="box-disc">
  <p class="disc mo-ver" style="color:#000000">
    * Disclaimer line 1<br />
    * Disclaimer line 2<br />
  </p>
  <p class="disc pc-ver" style="color:#000000">
    * Disclaimer line 1<br />
    * Disclaimer line 2<br />
  </p>
</div>
```

**Typography Notes:**

- All colors applied via inline styles
- Manual `<br>` tags for line breaks (different on mobile vs desktop)
- Strong emphasis using `<strong>` tags
- Special vertical alignment fix: `.component-text-inner .desc strong {vertical-align: baseline}`

---

## 13. Layout Visualization

### Typical Page Flow

```
┌─────────────────────────────────────────┐
│ Hero KV (stc-features-kv)              │ ← Full-width hero with overlay text
│ - Background image (responsive)         │
│ - Overlay text + CTA button            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Disclaimer Text (textbox-simple)       │ ← Legal/feature disclaimers
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Styled Text (textbox-simple stc)       │ ← Marketing copy with emphasis
│ - Centered text with <strong> tags     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Feature Benefit (img-bottom)           │ ← Title + video/image below
│ ┌─────────────────────────────────────┐ │
│ │ Title: "AI폰, 한 손에 쏙"            │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ [Video/Image]                       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Feature Benefit (img-left-5to5)        │ ← 50/50 split layout
│ ┌─────────────┬─────────────────────┐  │
│ │  [Image]    │  Title              │  │
│ │             │  Description        │  │
│ └─────────────┴─────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Full-Bleed Feature (feature-full-bleed)│ ← Immersive full-width
│ - Black background (#000000)            │
│ - White text                            │
│ - Edge-to-edge image                   │
└─────────────────────────────────────────┘
```

---

## 14. Implementation Recommendations

### For Editor Template Replication

#### 14.1 Component System

- Create reusable component templates for each type:
  - `FeatureBenefit` (with layout variants: bottom, left, right)
  - `TextboxSimple` (with stc variant)
  - `FeatureFullBleed`
  - `HeroKV`

#### 14.2 Responsive Approach

- **Option A:** Use CSS media queries instead of duplicate content

  ```css
  .title {
    display: none;
  }
  @media (max-width: 800px) {
    .title.mo-ver {
      display: block;
    }
  }
  @media (min-width: 801px) {
    .title.pc-ver {
      display: block;
    }
  }
  ```

- **Option B:** Keep dual-content approach for SEO/different text lengths

#### 14.3 Spacing System

- Define CSS variables for consistent spacing:

  ```css
  :root {
    --pt-none: 0;
    --pt-nrml: 60px;
    --pb-none: 0;
    --pb-nrml: 60px;
  }

  @media (max-width: 800px) {
    :root {
      --pt-nrml: 40px;
      --pb-nrml: 40px;
    }
  }
  ```

#### 14.4 Color System

- Use CSS custom properties for theming:
  ```css
  :root {
    --bg-white: #ffffff;
    --bg-black: #000000;
    --text-primary: #000000;
    --text-inverse: #ffffff;
    --text-muted: #d4d4d4;
  }
  ```

#### 14.5 Image Optimization

- Implement lazy loading (Intersection Observer or library)
- Use `<picture>` for art direction
- Provide fallback placeholder images

#### 14.6 Accessibility

- Include `.blind` utility class for screen reader text
- Add proper ARIA labels to interactive elements
- Ensure keyboard navigation works
- Maintain semantic HTML structure

#### 14.7 Typography

- Extract font sizes, weights, line heights from visual inspection
- Create utility classes for text alignment variants
- Support `<strong>` emphasis within body text

---

## 15. Key Technical Patterns

### Pattern 1: BEM-like Component Naming

```
.stc-features-kv               (Block)
.stc-features-kv__text-wrap    (Element)
.stc-features-kv__picture      (Element)
.stc-features-kv__cta          (Element)
```

### Pattern 2: Modifier Classes

```
.new-component      (Version marker)
.pt-none, .pb-none  (Spacing modifiers)
.mo-ver, .pc-ver    (Device modifiers)
.img-bottom         (Layout modifier)
```

### Pattern 3: Data Attributes for Non-Styling Purposes

```
data-cptnm          (Component name for CMS/analytics)
data-omni           (Analytics tracking)
data-di-id          (Dynamic insights ID)
data-type="seo"     (Metadata marker)
```

### Pattern 4: Inline Styles for Dynamic Content

```html
style="background-color:#FFFFFF" style="color:#000000"
```

Likely populated by CMS, allowing per-component customization

### Pattern 5: Lazy Loading

```html
src="/sec/static/_images/common/img_baseimg_null.png" data-src="//images.samsung.com/actual-image.jpg" class="lozad"
```

### Pattern 6: Responsive Images

```html
<picture>
  <source media="(min-width:801px)" srcset="desktop.jpg" />
  <source media="(max-width:800px)" srcset="mobile.jpg" />
  <img src="desktop.jpg" alt="..." />
</picture>
```

### Pattern 7: SEO Structured Data

```html
<script type="application/ld+json" data-type="seo">
  { "@type": "VideoObject", ... }
</script>
```

---

## 16. Visual Design Analysis

### Spacing & Rhythm

- **Component Padding:** Appears to be ~60-80px top/bottom on desktop, ~40px on mobile
- **Max Width:** 1440px content container
- **Margins:** Auto-centered containers

### Color Usage

- **High Contrast:** Pure black (#000000) and white (#FFFFFF)
- **Minimalist Palette:** Only 3 colors total
- **Background Contrast:** Alternating white sections with occasional black for drama

### Image Treatment

- **High-Quality Product Photography:** Professional product shots
- **Consistent Aspect Ratios:** Images appear to follow standard aspect ratios per component type
- **Alt Text:** Detailed Korean descriptions for accessibility

### Typography Hierarchy (Estimated)

Based on class names and context:

- **H2 Titles:** Large, bold, primary messaging
- **Descriptions (`.desc`):** Medium body text with occasional `<strong>` emphasis
- **Disclaimers (`.disc`):** Smaller, lighter text with asterisks

---

## 17. Component Content Examples

### Component Name Distribution

Most common themes:

1. **AI Features** - "AI Phone in One Hand"
2. **Design** - "Ultra sleek. Ultra pocketable", "Bold colors"
3. **Durability** - "Thinnest yet most durable Flip"
4. **Camera** - "Pro-level 50 MP camera", "Max zoom. Min noise"
5. **Display** - Cover display features
6. **Comparisons** - "See the upgrades", "Camera Compare"

---

## 18. Files Generated

1. **Cleaned HTML:** `/tmp/bcFeatures_clean.html` (105,665 characters)
2. **Screenshot:** `/tmp/samsung_flip7_full.png` (full page capture)
3. **This Analysis:** Complete structural breakdown

---

## 19. Summary & Recommendations

### Strengths of This Design System

✅ **Highly modular** - Component-based architecture allows flexible CMS content
✅ **Accessible** - Screen reader support, semantic HTML, ARIA labels
✅ **SEO-optimized** - Structured data, descriptive alt text, semantic markup
✅ **Performance-focused** - Lazy loading, responsive images
✅ **Responsive** - Separate mobile/desktop content and images
✅ **Analytics-ready** - Comprehensive tracking attributes

### Considerations for Replication

⚠️ **Content Duplication** - Mobile/desktop versions duplicate HTML (could use CSS instead)
⚠️ **Inline Styles** - Colors defined inline (could use CSS variables)
⚠️ **Manual Line Breaks** - `<br>` tags for responsive text (could use CSS)
⚠️ **Custom Video Player** - Depends on proprietary `vodPlayer` script
⚠️ **Tight Coupling** - Component structure tied to specific CMS patterns

### Template Creation Priorities

1. **Create base component templates** (feature-benefit, textbox-simple, etc.)
2. **Define spacing/color systems** (CSS variables)
3. **Implement responsive image system** (picture elements + lazy loading)
4. **Build layout variants** (img-bottom, img-left, img-right, full-bleed)
5. **Add accessibility features** (blind class, ARIA labels)
6. **Set up tracking structure** (data attributes)

---

## 20. Next Steps

### To Complete This Research:

- [ ] Extract exact font sizes, weights, line heights (requires visual inspection or computed styles)
- [ ] Measure actual spacing values (px/rem for padding/margins)
- [ ] Analyze video player implementation (`vodPlayer` script)
- [ ] Document button/CTA styling (hover states, transitions)
- [ ] Map out mobile layout behavior (stacking order, alignment changes)
- [ ] Create Figma/design mockup based on screenshots
- [ ] Build React/Vue component library matching this structure

---

**End of Analysis**
