import type { EditorElement, SectionRole } from "../types"
import { DEFAULT_LAYOUT_PROPS } from "../types"

export interface PresetResult {
  section: Omit<EditorElement, 'id'>
  children: Array<Omit<EditorElement, 'id'>>
}

/**
 * Creates a section preset with container and pre-configured children.
 * All sections use type: 'div', position: 'relative', layoutMode: 'flex'.
 * parentId is set to '' in templates — filled by caller (addSection).
 * id fields are assigned by caller.
 */
export function createSectionPreset(role: SectionRole): PresetResult {
  const baseSection: Omit<EditorElement, 'id'> = {
    type: 'div',
    name: `${role}-section`,
    parentId: '',
    children: [],
    style: {
      position: 'relative',
      left: undefined,
      top: undefined,
      width: '100%',
      height: 'auto',
    },
    props: {},
    locked: false,
    visible: true,
    layoutMode: 'flex',
    layoutProps: { ...DEFAULT_LAYOUT_PROPS, direction: 'column' },
    sizing: { w: 'fill', h: 'hug' },
    canvasPosition: null,
    role,
  }

  switch (role) {
    case 'section': {
      // Empty section: flex-column, padding 40px, fill-width
      return {
        section: {
          ...baseSection,
          name: 'Section',
          layoutProps: {
            ...DEFAULT_LAYOUT_PROPS,
            direction: 'column',
            gap: 16,
            paddingTop: 40,
            paddingRight: 40,
            paddingBottom: 40,
            paddingLeft: 40,
          },
        },
        children: [],
      }
    }

    case 'header': {
      // Header: flex-row, logo div + nav text items, border-bottom, small padding
      return {
        section: {
          ...baseSection,
          name: 'Header',
          style: {
            ...baseSection.style,
            borderBottom: '1px solid #e2e8f0',
          },
          layoutProps: {
            ...DEFAULT_LAYOUT_PROPS,
            direction: 'row',
            gap: 24,
            paddingTop: 16,
            paddingRight: 24,
            paddingBottom: 16,
            paddingLeft: 24,
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        },
        children: [
          {
            type: 'text',
            name: 'Logo',
            parentId: '',
            children: [],
            style: {
              position: 'relative',
              left: undefined,
              top: undefined,
              fontSize: 20,
              fontWeight: 700,
              color: '#1a202c',
            },
            props: { content: 'Logo' },
            locked: false,
            visible: true,
            layoutMode: 'none',
            layoutProps: { ...DEFAULT_LAYOUT_PROPS },
            sizing: { w: 'hug', h: 'hug' },
            canvasPosition: null,
          },
          {
            type: 'div',
            name: 'Nav',
            parentId: '',
            children: [],
            style: {
              position: 'relative',
              left: undefined,
              top: undefined,
              width: 'auto',
              height: 'auto',
            },
            props: {},
            locked: false,
            visible: true,
            layoutMode: 'flex',
            layoutProps: {
              ...DEFAULT_LAYOUT_PROPS,
              direction: 'row',
              gap: 20,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              paddingLeft: 0,
              alignItems: 'center',
            },
            sizing: { w: 'hug', h: 'hug' },
            canvasPosition: null,
          },
        ],
      }
    }

    case 'hero': {
      // Hero: flex-column, center-aligned, large padding 80px, backgroundColor #6366f1,
      // heading + subtext + CTA button, white text
      return {
        section: {
          ...baseSection,
          name: 'Hero',
          style: {
            ...baseSection.style,
            backgroundColor: '#6366f1',
          },
          layoutProps: {
            ...DEFAULT_LAYOUT_PROPS,
            direction: 'column',
            gap: 20,
            paddingTop: 80,
            paddingRight: 40,
            paddingBottom: 80,
            paddingLeft: 40,
            alignItems: 'center',
            justifyContent: 'center',
          },
        },
        children: [
          {
            type: 'text',
            name: 'Hero Heading',
            parentId: '',
            children: [],
            style: {
              position: 'relative',
              left: undefined,
              top: undefined,
              fontSize: 48,
              fontWeight: 700,
              color: '#ffffff',
              textAlign: 'center',
            },
            props: { content: 'Welcome to Our Product' },
            locked: false,
            visible: true,
            layoutMode: 'none',
            layoutProps: { ...DEFAULT_LAYOUT_PROPS },
            sizing: { w: 'hug', h: 'hug' },
            canvasPosition: null,
          },
          {
            type: 'text',
            name: 'Hero Subtext',
            parentId: '',
            children: [],
            style: {
              position: 'relative',
              left: undefined,
              top: undefined,
              fontSize: 18,
              color: '#e0e7ff',
              textAlign: 'center',
            },
            props: { content: 'Build amazing things with our platform' },
            locked: false,
            visible: true,
            layoutMode: 'none',
            layoutProps: { ...DEFAULT_LAYOUT_PROPS },
            sizing: { w: 'hug', h: 'hug' },
            canvasPosition: null,
          },
          {
            type: 'sc:button',
            name: 'CTA Button',
            parentId: '',
            children: [],
            style: {
              position: 'relative',
              left: undefined,
              top: undefined,
            },
            props: { label: 'Get Started', variant: 'secondary', size: 'lg' },
            locked: false,
            visible: true,
            layoutMode: 'none',
            layoutProps: { ...DEFAULT_LAYOUT_PROPS },
            sizing: { w: 'hug', h: 'hug' },
            canvasPosition: null,
          },
        ],
      }
    }

    case 'features': {
      // Features: grid 3-column layout, backgroundColor #f8fafc, 3 card divs with border/padding
      return {
        section: {
          ...baseSection,
          name: 'Features',
          style: {
            ...baseSection.style,
            backgroundColor: '#f8fafc',
          },
          layoutMode: 'grid',
          layoutProps: {
            ...DEFAULT_LAYOUT_PROPS,
            direction: 'column',
            gap: 24,
            paddingTop: 60,
            paddingRight: 40,
            paddingBottom: 60,
            paddingLeft: 40,
          },
          gridProps: {
            columns: 3,
            gap: 24,
          },
        },
        children: [
          {
            type: 'div',
            name: 'Feature Card 1',
            parentId: '',
            children: [],
            style: {
              position: 'relative',
              left: undefined,
              top: undefined,
              width: 'auto',
              height: 'auto',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
            },
            props: {},
            locked: false,
            visible: true,
            layoutMode: 'flex',
            layoutProps: {
              ...DEFAULT_LAYOUT_PROPS,
              direction: 'column',
              gap: 12,
              paddingTop: 24,
              paddingRight: 24,
              paddingBottom: 24,
              paddingLeft: 24,
            },
            sizing: { w: 'fill', h: 'hug' },
            canvasPosition: null,
          },
          {
            type: 'div',
            name: 'Feature Card 2',
            parentId: '',
            children: [],
            style: {
              position: 'relative',
              left: undefined,
              top: undefined,
              width: 'auto',
              height: 'auto',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
            },
            props: {},
            locked: false,
            visible: true,
            layoutMode: 'flex',
            layoutProps: {
              ...DEFAULT_LAYOUT_PROPS,
              direction: 'column',
              gap: 12,
              paddingTop: 24,
              paddingRight: 24,
              paddingBottom: 24,
              paddingLeft: 24,
            },
            sizing: { w: 'fill', h: 'hug' },
            canvasPosition: null,
          },
          {
            type: 'div',
            name: 'Feature Card 3',
            parentId: '',
            children: [],
            style: {
              position: 'relative',
              left: undefined,
              top: undefined,
              width: 'auto',
              height: 'auto',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
            },
            props: {},
            locked: false,
            visible: true,
            layoutMode: 'flex',
            layoutProps: {
              ...DEFAULT_LAYOUT_PROPS,
              direction: 'column',
              gap: 12,
              paddingTop: 24,
              paddingRight: 24,
              paddingBottom: 24,
              paddingLeft: 24,
            },
            sizing: { w: 'fill', h: 'hug' },
            canvasPosition: null,
          },
        ],
      }
    }

    case 'cta': {
      // CTA: flex-column, center-aligned, backgroundColor #1e293b, heading + button
      return {
        section: {
          ...baseSection,
          name: 'CTA',
          style: {
            ...baseSection.style,
            backgroundColor: '#1e293b',
          },
          layoutProps: {
            ...DEFAULT_LAYOUT_PROPS,
            direction: 'column',
            gap: 24,
            paddingTop: 60,
            paddingRight: 40,
            paddingBottom: 60,
            paddingLeft: 40,
            alignItems: 'center',
            justifyContent: 'center',
          },
        },
        children: [
          {
            type: 'text',
            name: 'CTA Heading',
            parentId: '',
            children: [],
            style: {
              position: 'relative',
              left: undefined,
              top: undefined,
              fontSize: 32,
              fontWeight: 700,
              color: '#ffffff',
              textAlign: 'center',
            },
            props: { content: 'Ready to get started?' },
            locked: false,
            visible: true,
            layoutMode: 'none',
            layoutProps: { ...DEFAULT_LAYOUT_PROPS },
            sizing: { w: 'hug', h: 'hug' },
            canvasPosition: null,
          },
          {
            type: 'sc:button',
            name: 'CTA Button',
            parentId: '',
            children: [],
            style: {
              position: 'relative',
              left: undefined,
              top: undefined,
            },
            props: { label: 'Sign up now', variant: 'default', size: 'lg' },
            locked: false,
            visible: true,
            layoutMode: 'none',
            layoutProps: { ...DEFAULT_LAYOUT_PROPS },
            sizing: { w: 'hug', h: 'hug' },
            canvasPosition: null,
          },
        ],
      }
    }

    case 'footer': {
      // Footer: flex-row, backgroundColor #1e293b, copyright text + links
      return {
        section: {
          ...baseSection,
          name: 'Footer',
          style: {
            ...baseSection.style,
            backgroundColor: '#1e293b',
          },
          layoutProps: {
            ...DEFAULT_LAYOUT_PROPS,
            direction: 'row',
            gap: 24,
            paddingTop: 24,
            paddingRight: 40,
            paddingBottom: 24,
            paddingLeft: 40,
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        },
        children: [
          {
            type: 'text',
            name: 'Copyright',
            parentId: '',
            children: [],
            style: {
              position: 'relative',
              left: undefined,
              top: undefined,
              fontSize: 14,
              color: '#94a3b8',
            },
            props: { content: '© 2026 Company. All rights reserved.' },
            locked: false,
            visible: true,
            layoutMode: 'none',
            layoutProps: { ...DEFAULT_LAYOUT_PROPS },
            sizing: { w: 'hug', h: 'hug' },
            canvasPosition: null,
          },
          {
            type: 'div',
            name: 'Footer Links',
            parentId: '',
            children: [],
            style: {
              position: 'relative',
              left: undefined,
              top: undefined,
              width: 'auto',
              height: 'auto',
            },
            props: {},
            locked: false,
            visible: true,
            layoutMode: 'flex',
            layoutProps: {
              ...DEFAULT_LAYOUT_PROPS,
              direction: 'row',
              gap: 16,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              paddingLeft: 0,
              alignItems: 'center',
            },
            sizing: { w: 'hug', h: 'hug' },
            canvasPosition: null,
          },
        ],
      }
    }

    default:
      return {
        section: baseSection,
        children: [],
      }
  }
}
