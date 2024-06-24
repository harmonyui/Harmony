/**
 * mirror from https://github.com/facebook/react/blob/v16.13.1/packages/react-devtools-shared/src/backend/views/utils.js
 */

interface Box {
  top: number
  left: number
  width: number
  height: number
}

// Note that the Overlay components are not affected by the active Theme,
// because they highlight elements in the main Chrome window (outside of devtools).
// The colors below were chosen to roughly match those used by Chrome devtools.

export class OverlayRect {
  node: HTMLElement
  border: HTMLElement
  padding: HTMLElement
  content: HTMLElement

  constructor(doc: Document, container: HTMLElement) {
    this.node = doc.createElement('div')
    this.border = doc.createElement('div')
    this.padding = doc.createElement('div')
    this.content = doc.createElement('div')

    this.border.style.borderColor = overlayStyles.background
    this.padding.style.borderColor = overlayStyles.padding
    //this.content.style.backgroundColor = overlayStyles.background

    Object.assign(this.node.style, {
      borderColor: overlayStyles.margin,
      pointerEvents: 'none',
      position: 'fixed',
    })

    this.node.style.zIndex = '10000000'

    this.node.appendChild(this.border)
    this.border.appendChild(this.padding)
    this.padding.appendChild(this.content)

    // ensure OverlayRect dom always before OverlayTip dom rather than cover OverlayTip
    container.prepend(this.node)
  }

  remove() {
    if (this.node.parentNode) {
      this.node.parentNode.removeChild(this.node)
    }
  }

  update(box: Rect, dims: BoxSizing) {
    dims.borderBottom = 1
    dims.borderLeft = 1
    dims.borderRight = 1
    dims.borderTop = 1
    boxWrap(dims, 'margin', this.node)
    boxWrap(dims, 'border', this.border)
    boxWrap(dims, 'padding', this.padding)

    Object.assign(this.content.style, {
      height: `${
        box.height -
        dims.borderTop -
        dims.borderBottom -
        dims.paddingTop -
        dims.paddingBottom
      }px`,
      width: `${
        box.width -
        dims.borderLeft -
        dims.borderRight -
        dims.paddingLeft -
        dims.paddingRight
      }px`,
    })

    Object.assign(this.node.style, {
      top: `${box.top - dims.marginTop}px`,
      left: `${box.left - dims.marginLeft}px`,
    })
  }
}

function boxWrap(
  dims: BoxSizing,
  what: 'margin' | 'padding' | 'border',
  node: HTMLElement,
) {
  Object.assign(node.style, {
    borderTopWidth: `${dims[`${what}Top`]}px`,
    borderLeftWidth: `${dims[`${what}Left`]}px`,
    borderRightWidth: `${dims[`${what}Right`]}px`,
    borderBottomWidth: `${dims[`${what}Bottom`]}px`,
    borderStyle: 'solid',
  })
}

const overlayStyles = {
  background: 'rgba(120, 170, 210, 0.7)',
  padding: 'rgba(77, 200, 0, 0.3)',
  margin: 'rgba(255, 155, 0, 0.3)',
  border: 'rgba(255, 200, 50, 0.3)',
}

/**
 * mirror from https://github.com/facebook/react/blob/v16.13.1/packages/react-devtools-shared/src/backend/views/Highlighter/Overlay.js
 *
 * remove all process for iframe, because iframe only need to think in chrome extension app,
 * which will deal multiple levels of nesting iframe.
 */

export interface Rect {
  bottom: number
  height: number
  left: number
  right: number
  top: number
  width: number
}

export interface BoxSizing {
  borderTop: number
  borderBottom: number
  borderLeft: number
  borderRight: number
  paddingTop: number
  paddingBottom: number
  paddingLeft: number
  paddingRight: number
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
}

// Calculate a boundingClientRect for a node relative to boundaryWindow,
// taking into account any offsets caused by intermediate iframes.
export function getNestedBoundingClientRect(
  node: HTMLElement,
  boundaryWindow: Window | HTMLElement,
): Rect
export function getNestedBoundingClientRect(node: HTMLElement): Rect {
  return node.getBoundingClientRect()
}

export function getElementDimensions(domElement: Element) {
  const calculatedStyle = window.getComputedStyle(domElement)
  return {
    borderLeft: Number.parseInt(calculatedStyle.borderLeftWidth, 10),
    borderRight: Number.parseInt(calculatedStyle.borderRightWidth, 10),
    borderTop: Number.parseInt(calculatedStyle.borderTopWidth, 10),
    borderBottom: Number.parseInt(calculatedStyle.borderBottomWidth, 10),
    marginLeft: Number.parseInt(calculatedStyle.marginLeft, 10),
    marginRight: Number.parseInt(calculatedStyle.marginRight, 10),
    marginTop: Number.parseInt(calculatedStyle.marginTop, 10),
    marginBottom: Number.parseInt(calculatedStyle.marginBottom, 10),
    paddingLeft: Number.parseInt(calculatedStyle.paddingLeft, 10),
    paddingRight: Number.parseInt(calculatedStyle.paddingRight, 10),
    paddingTop: Number.parseInt(calculatedStyle.paddingTop, 10),
    paddingBottom: Number.parseInt(calculatedStyle.paddingBottom, 10),
  }
}
