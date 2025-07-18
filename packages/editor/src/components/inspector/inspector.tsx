/* eslint-disable prefer-const -- ok */
/* eslint-disable @typescript-eslint/no-explicit-any -- ok */

'use client'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import hotkeys from 'hotkeys-js'
import $ from 'jquery'
import { useSnapping } from '../snapping/snapping'
import type {
  SelectMode,
  ComponentUpdateWithoutGlobal,
} from '../harmony-context'
import { useSidePanel } from '../panel/side-panel'
import { useHarmonyContext } from '../harmony-context'
import { useHarmonyStore } from '../../hooks/state'
import { useCopyPasteDelete } from '../../hooks/copy-paste-delete'
import { selectDesignerElement } from '../../utils/element-utils'
import { isTextElement } from '../../utils/element-predicate'
import { useHighlighter } from './highlighter'
import { useHotKeys } from '../../hooks/hotkeys'

export function isSizeThreshold(element: HTMLElement, scale: number): boolean {
  const sizeThreshold = 10
  const rect = element.getBoundingClientRect()
  if (rect.height * scale < sizeThreshold || rect.width < sizeThreshold) {
    return false
  }

  return true
}
export function isSelectable(element: HTMLElement, scale: number): boolean {
  const style = getComputedStyle(element)
  if (style.position === 'absolute') {
    return false
  }

  //We don't want to select the inner workings of an svg
  if (
    ['rect', 'g', 'path', 'circle', 'line'].includes(
      element.tagName.toLowerCase(),
    )
  )
    return false

  if (element.dataset.nonSelectable === 'true') {
    return false
  }

  return isSizeThreshold(element, scale)
}

export function removeTextContentSpans(element: HTMLElement) {
  const children = element.children
  for (let i = 0; i < children.length; i++) {
    const node = children[i] as HTMLElement
    if (node.dataset.harmonyText !== 'true') continue
    if (!node.textContent) continue

    const textNode = document.createTextNode(node.textContent)

    const beforeNode = i < children.length - 1 ? children[i + 1] : undefined
    if (beforeNode) {
      element.insertBefore(textNode, beforeNode)
    } else {
      element.appendChild(textNode)
    }
    node.remove()
  }
}

export interface InspectorProps {
  rootElement: HTMLElement | undefined
  parentElement: HTMLElement | undefined
  mode: SelectMode
  onReorder: (props: { from: number; to: number; element: HTMLElement }) => void
  onChange: (
    component: HTMLElement,
    update: ComponentUpdateWithoutGlobal[],
    execute?: boolean,
  ) => void
  scale: number
  enableDrag?: boolean
}
export const Inspector: React.FunctionComponent<InspectorProps> = ({
  onChange,
  rootElement,
  parentElement,
  mode,
  scale,
  enableDrag = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { setError, onTextChange } = useHarmonyContext()
  const isDemo = useHarmonyStore((state) => state.isDemo)

  const source = useHarmonyStore((state) => state.source)
  const isOverlay = useHarmonyStore((state) => state.isOverlay)
  const selectedComponent = useHarmonyStore(
    (state) => state.selectedComponent?.element,
  )
  const onSelect = useHarmonyStore((state) => state.selectElement)
  const hoveredComponent = useHarmonyStore((state) => state.hoveredComponent)
  const onHoverProps = useHarmonyStore((state) => state.hoverComponent)

  const { panel } = useSidePanel()

  useCopyPasteDelete()

  //If the source is not the document, then the overlay needs an offset to get it's position right
  const offsetElement =
    source === 'iframe' ? document.getElementsByTagName('iframe')[0] : undefined

  const inspectorState: InspectorState = useMemo(
    () => ({ showingLayoutPanel: true }),
    [panel],
  )

  const onFlexClick = useCallback(() => {
    if (!selectedComponent) return

    const parent = selectDesignerElement(selectedComponent).parentElement!
    const flexEnabled = parent.dataset.harmonyFlex
    if (flexEnabled) {
      const $text = $('[name="harmony-flex-text"]')
      //TODO: This is kind of hacky to use jquery to trigger the flex change, but we can't use react because the
      //overlay where the flex toggle lives is outside of react. We might be able to reverse dependencies
      //to make this logic live here instead of in this jquery pointer down function
      $text.trigger('pointerdown')
    }
  }, [selectedComponent])

  const overlayRef = useOverlayRef({
    parentElement,
    containerElement: containerRef.current,
    offsetElement,
    scale,
    inspectorState,
    onFlexClick,
    onTextChange,
  })

  const { isDragging } = useSnapping({
    enabled: enableDrag,
    element: selectedComponent
      ? selectDesignerElement(selectedComponent)
      : undefined,
    onIsDragging(event, element) {
      const container = containerRef.current
      if (container === null || parentElement === undefined) return

      if (overlayRef.current === undefined) {
        overlayRef.current = new Overlay(
          container,
          parentElement,
          offsetElement,
        )
      }

      if (selectedComponent) {
        overlayRef.current.select(element, scale, false, inspectorState, {
          onFlexClick,
          onTextChange,
        })
      } else {
        overlayRef.current.remove('select')
      }
    },
    onDragFinish(element, oldValues) {
      if (!selectedComponent) return

      const updates: ComponentUpdateWithoutGlobal[] = []

      for (const oldValue of oldValues) {
        const [element, oldProperties] = oldValue
        //Round all of the values;
        ;[
          'marginLeft',
          'marginRight',
          'marginTop',
          'marginBottom',
          'paddingLeft',
          'paddingRight',
          'paddingTop',
          'paddingBottom',
          'gap',
          'width',
          'height',
        ].forEach((property) => {
          const propValue = element.style[property as unknown as number]
          if (!propValue || propValue === 'auto') return

          const float = parseFloat(propValue)
          if (isNaN(float)) return

          const num = float //round(float, 0, true);
          let unit = propValue.replace(String(float), '')
          if (unit === propValue) {
            unit = 'px'
          }
          const value = `${num}${unit}`

          element.style[property as unknown as number] = value
        })

        Object.keys(oldProperties).forEach((property) => {
          const value = element.style[property as unknown as number]
          if (!value) return

          const componentId = element.dataset.harmonyId || ''
          const oldValue = oldProperties[property]

          if (!oldValue) {
            throw new Error('Why are you happneing?')
          }

          const childIndex = Array.from(
            element.parentElement!.children,
          ).indexOf(element)
          if (childIndex < 0) throw new Error('Cannot get right child index')

          const update: ComponentUpdateWithoutGlobal = {
            componentId,
            type: 'className',
            name: property,
            value,
            oldValue,
            childIndex,
            dateModified: new Date(),
          }

          updates.push(update)
        })
      }

      onChange(element, updates, true)
    },
    onError(error) {
      const container = containerRef.current
      if (container === null || parentElement === undefined) return

      if (overlayRef.current === undefined) {
        overlayRef.current = new Overlay(
          container,
          parentElement,
          offsetElement,
        )
      }

      if (selectedComponent) {
        overlayRef.current.select(
          selectedComponent,
          scale,
          true,
          inspectorState,
          { onFlexClick, onTextChange },
        )
      } else {
        overlayRef.current.remove('select')
      }
      setError(error)
    },
    scale,
  })

  useHotKeys('esc', () => {
    const parent = selectedComponent?.parentElement
    onSelect(
      rootElement?.contains(parent ?? null) ? (parent ?? undefined) : undefined,
    )
  })

  useEffect(() => {
    const container = containerRef.current
    if (
      container === null ||
      rootElement === undefined ||
      parentElement === undefined
    )
      return

    if (overlayRef.current === undefined) {
      overlayRef.current = new Overlay(container, parentElement, offsetElement)
    }

    //TODO: Hacky fix. Inline elements are not affected by vertical margin, so the only way to get them to move when next
    //to a block element is to change it to a block element.
    if (selectedComponent && enableDrag) {
      const parent = selectedComponent.parentElement!
      const selfIndex = Array.from(parent.children).indexOf(selectedComponent)
      const prevSibling =
        selfIndex > 0
          ? (parent.children[selfIndex - 1] as HTMLElement)
          : undefined
      const nextSibling =
        selfIndex < parent.children.length - 1
          ? (parent.children[selfIndex + 1] as HTMLElement)
          : undefined

      const prevSiblingDisplay =
        prevSibling && isSelectable(prevSibling, scale)
          ? getComputedStyle(prevSibling).display
          : undefined
      const nextSiblingDisplay =
        nextSibling && isSelectable(nextSibling, scale)
          ? getComputedStyle(nextSibling).display
          : undefined

      const styles = getComputedStyle(selectedComponent)

      if (
        styles.display === 'inline' &&
        (prevSiblingDisplay === 'block' || nextSiblingDisplay === 'block')
      ) {
        selectedComponent.style.display = 'block'
        selectedComponent.style.marginTop = '0px'
        selectedComponent.style.marginBottom = '0px'
      } else if (styles.display === 'block') {
        if (prevSiblingDisplay === 'inline') {
          prevSibling!.style.display = 'block'
          prevSibling!.style.marginTop = '0px'
          prevSibling!.style.marginBottom = '0px'
        }
        if (nextSiblingDisplay === 'inline') {
          nextSibling!.style.display = 'block'
          nextSibling!.style.marginTop = '0px'
          nextSibling!.style.marginBottom = '0px'
        }
      }
    }

    if (selectedComponent) {
      const parent = selectDesignerElement(selectedComponent).parentElement
      if (
        parent &&
        getComputedStyle(parent).display.includes('flex') &&
        Array.from(parent.children).filter((child) =>
          isSelectable(child as HTMLElement, scale),
        ).length > 2
      ) {
        if (!parent.dataset.harmonyFlex && !isDemo) {
          //parent.dataset.harmonyFlex = 'true';
        }
      }
      overlayRef.current.select(
        selectedComponent,
        scale,
        false,
        inspectorState,
        { onTextChange, onFlexClick },
      )
    } else {
      overlayRef.current.remove('select')
    }
  }, [selectedComponent, scale, inspectorState, enableDrag])

  useEffect(() => {
    const container = containerRef.current
    if (
      container === null ||
      rootElement === undefined ||
      parentElement === undefined
    )
      return

    if (overlayRef.current === undefined) {
      overlayRef.current = new Overlay(container, parentElement, offsetElement)
    }
    if (hoveredComponent && !isDragging) {
      overlayRef.current.hover(hoveredComponent, scale, inspectorState)
    } else {
      overlayRef.current.remove('hover')
    }
  }, [hoveredComponent, scale, isDragging, inspectorState])

  const isInteractableComponent = useCallback(
    (component: HTMLElement) => {
      //TODO: Get rid of dependency on harmonyText
      if (!component.dataset.harmonyId && !component.dataset.harmonyText) {
        return false
      }

      if (!isSelectable(component, scale)) {
        return false
      }

      if (mode === 'tweezer') return true

      // The current component scope is determined by either the currently selected component or
      // the parent of the root element (this is because we want the root element to be selectable)
      const startingComponent = selectedComponent || rootElement?.parentElement
      if (startingComponent) {
        return Array.from(startingComponent.children).includes(component)
      }
      return true
    },
    [selectedComponent, rootElement, mode, scale],
  )

  const onHover = useEffectEvent(
    (element: HTMLElement, x: number, y: number, event: MouseEvent) => {
      const container = containerRef.current
      if (container === null) return false
      if (rootElement && !rootElement.contains(element)) return true

      if (isDragging || !isInteractableComponent(element) || event.altKey) {
        onHoverProps(undefined)
        return false
      }

      onHoverProps(element)

      return true
    },
  )
  const onClick = useEffectEvent(
    (element: HTMLElement, x: number, y: number, event: MouseEvent) => {
      const container = containerRef.current
      if (container === null || isDragging) return false
      if (rootElement && !rootElement.contains(element)) return true

      //TODO: ctrlKey is kind of hacky. Find a better way to turn off selection
      if (event.altKey) return false

      if (!isInteractableComponent(element)) {
        //If we get here, that means we have clicked outside of the parent, which means we should deselect
        onSelect(undefined)
        return false
      }

      //Set timeout allows blur events to fire before a new selection is made
      setTimeout(() => {
        onSelect(element)
      })

      // This stops the event from bubbling up to the modal libraries like Radix
      event.stopPropagation()

      return true
    },
  )

  const onHold = useEffectEvent(() => {
    return true
  })

  const noEvents = useMemo(() => {
    const _noEvents = ['#harmony-overlay']
    if (isOverlay) {
      _noEvents.push('#harmony-container')
    }

    return _noEvents
  }, [isOverlay])

  useHighlighter({
    handlers: {
      onClick,
      onHover,
      onHold,
      onPointerUp() {
        return true
      },
      onDoubleClick(_, clientX, clientY) {
        const isTextError = (element: HTMLElement): boolean => {
          const trueElement =
            element.dataset.harmonyText === 'true'
              ? element.parentElement!
              : element

          return trueElement.dataset.harmonyError === 'text'
        }
        if (selectedComponent) {
          if (
            !isDragging &&
            isTextElement(selectedComponent) &&
            selectedComponent.contentEditable !== 'true'
          ) {
            if (isTextError(selectedComponent)) {
              setError("Element's text is not yet editable")
              return true
            }
            selectedComponent.contentEditable = 'true'
            selectedComponent.style.cursor = 'auto'

            // Focus the selectedComponent
            selectedComponent.focus()

            // Insert the cursor at the end of the text
            const range = document.caretRangeFromPoint(clientX, clientY)

            if (range) {
              // Collapse the range to the start
              range.collapse(true)

              // Set the selection to the collapsed range
              const selection = window.getSelection()
              selection?.removeAllRanges()
              selection?.addRange(range)
            }
          }
        }

        return true
      },
    },
    container: rootElement,
    noEvents,
  })

  return (
    <>
      <div ref={containerRef} className='z-100' id='harmonyInspector'>
        <div id='harmony-snap-guides'></div>
      </div>
    </>
  )
}

const useOverlayRef = ({
  parentElement,
  containerElement,
  offsetElement,
  scale,
  inspectorState,
  onFlexClick,
  onTextChange,
}: {
  parentElement: HTMLElement | undefined
  containerElement: HTMLElement | null
  offsetElement: HTMLIFrameElement | undefined
  scale: number
  inspectorState: InspectorState
  onFlexClick: () => void
  onTextChange: (
    value: string,
    oldValue: string,
    selectedElement: HTMLElement | undefined,
  ) => void
}): React.MutableRefObject<Overlay | undefined> => {
  const overlayRef = useRef<Overlay>(undefined)
  const update = useHarmonyStore((state) => state.updateTheCounter)
  const updateOverlay = useHarmonyStore((state) => state.updateCounter)
  const selectedComponent = useHarmonyStore((state) => state.selectedComponent)

  const updateOverlayRef = useEffectEvent(() => {
    const container = containerElement
    if (container === null || parentElement === undefined) return

    if (overlayRef.current === undefined) {
      overlayRef.current = new Overlay(container, parentElement, offsetElement)
    }

    if (selectedComponent) {
      overlayRef.current.select(
        selectedComponent.element,
        scale,
        false,
        inspectorState,
        { onFlexClick, onTextChange },
      )
    } else {
      overlayRef.current.remove('select')
    }
    overlayRef.current.remove('hover')
  })

  //Create the overlay
  useEffect(() => {
    if (containerElement && overlayRef.current?.parent !== parentElement) {
      overlayRef.current = new Overlay(
        containerElement,
        parentElement!,
        offsetElement,
      )
    }
  }, [overlayRef, parentElement, containerElement, offsetElement])

  //Update the overlay when the counter has changed
  useEffect(() => {
    updateOverlayRef()
  }, [updateOverlay, updateOverlayRef])

  const onScroll = useEffectEvent(() => updateOverlayRef())

  //Change the counter when we scroll to keep the overlay rect up to date
  useEffect(() => {
    document.addEventListener('scroll', onScroll)

    return () => {
      document.removeEventListener('scroll', onScroll)
    }
  }, [update])

  return overlayRef
}

export interface Rect {
  bottom: number
  height: number
  left: number
  right: number
  top: number
  width: number
}

export interface RectBox {
  left: number
  right: number
  top: number
  bottom: number
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
interface InteractProps {
  values: {
    rect: OverlayRect
    element: HTMLElement
  }[]
  observer: ResizeObserver | undefined
  aborter: AbortController
}
class Overlay {
  window: Window
  tipBoundsWindow: Window
  rects: Map<'select' | 'hover', InteractProps>

  constructor(
    private container: HTMLElement,
    public parent: HTMLElement,
    private offsetElement: HTMLElement | undefined,
  ) {
    // Find the root window, because overlays are positioned relative to it.
    const currentWindow =
      (
        window as unknown as Window &
          typeof globalThis & {
            __REACT_DEVTOOLS_TARGET_WINDOW__: Window | undefined
          }
      ).__REACT_DEVTOOLS_TARGET_WINDOW__ || window
    this.window = currentWindow

    // When opened in shells/dev,
    // the tooltip should be bound by the app iframe, not by the topmost window.
    const tipBoundsWindow =
      (
        window as unknown as Window &
          typeof globalThis & {
            __REACT_DEVTOOLS_TARGET_WINDOW__: Window | undefined
          }
      ).__REACT_DEVTOOLS_TARGET_WINDOW__ || window
    this.tipBoundsWindow = tipBoundsWindow

    this.rects = new Map()
  }

  remove(method: 'select' | 'hover') {
    const stuff = this.rects.get(method)
    if (stuff) {
      stuff.values.forEach(({ rect, element }) => {
        rect.remove()
        element.style.cursor = ''
      })
      this.rects.delete(method)
      if (method === 'select' && stuff.values[0]) {
        stuff.values[0].element.contentEditable = 'inherit'
        stuff.values[0].element.removeAttribute('data-selected')
      }
      stuff.observer?.disconnect()
      stuff.aborter.abort()
      if (stuff.values[0]?.element.draggable) {
        stuff.values[0].element.draggable = false
      }
    }
  }

  name(element: HTMLElement) {
    let name = element.nodeName.toLowerCase()

    const node = element
    const hook = (
      node.ownerDocument.defaultView as unknown as
        | (Window & typeof globalThis & { __REACT_DEVTOOLS_GLOBAL_HOOK__: any })
        | undefined
    )?.__REACT_DEVTOOLS_GLOBAL_HOOK__
    if (hook?.rendererInterfaces) {
      let ownerName = null
      for (const rendererInterface of hook.rendererInterfaces.values()) {
        const id = rendererInterface.getFiberIDForNative(node, true)
        if (id !== null) {
          ownerName = rendererInterface.getDisplayNameForFiberID(id, true)
          break
        }
      }

      if (ownerName) {
        name += ` (in ${ownerName})`
      }
    }

    return name
  }

  hover(element: HTMLElement, scale: number, inspectorState: InspectorState) {
    this.inspect(element, 'hover', scale, false, inspectorState)
  }

  select(
    element: HTMLElement,
    scale: number,
    error: boolean,
    inspectorState: InspectorState,
    listeners: {
      onTextChange: (
        value: string,
        oldValue: string,
        selectedElement: HTMLElement | undefined,
        shouldUpdate?: boolean,
      ) => void
      onFlexClick: () => void
    },
  ) {
    this.inspect(element, 'select', scale, error, inspectorState)

    const stuff = this.rects.get('select')
    if (!stuff) throw new Error('What happend??')

    if (
      Array.from(element.children).every(
        (child) => child.nodeType === Node.TEXT_NODE,
      )
    ) {
      let lastTextValue = element.textContent || ''
      element.addEventListener(
        'input',
        (e) => {
          const target = e.target as HTMLElement
          const value = target.textContent || ''
          listeners.onTextChange(value, lastTextValue, target, false)
          lastTextValue = value
        },
        { signal: stuff.aborter.signal },
      )
    }

    //Select the parent too
    const designerElement = selectDesignerElement(element)
    const parent = designerElement.parentElement
    if (parent) {
      const [box, dims] = this.getSizing(parent)
      const rect = new OverlayRect(
        this.window.document,
        parent,
        this.container,
        scale,
        inspectorState,
        listeners.onFlexClick,
      )
      dims.borderBottom = 2 / scale
      dims.borderLeft = 2 / scale
      dims.borderRight = 2 / scale
      dims.borderTop = 2 / scale
      rect.update(
        { box, dims, borderSize: 2, borderStyle: 'dashed', opacity: 0.5 },
        scale,
      )
      stuff.values.push({ rect, element: parent })
    }
  }

  inspect(
    element: HTMLElement,
    method: 'select' | 'hover',
    scale: number,
    error: boolean,
    inspectorState: InspectorState,
  ) {
    // We can't get the size of text nodes or comment nodes. React as of v15
    // heavily uses comment nodes to delimit text.
    if (element.nodeType !== Node.ELEMENT_NODE) {
      return
    }

    const [box, dims] = this.getSizing(element)
    const rect = new OverlayRect(
      this.window.document,
      element,
      this.container,
      scale,
      inspectorState,
    )
    rect[method](box, dims, scale, error)

    this.remove(method)

    let mutationObserver: ResizeObserver | undefined
    const size = element.getBoundingClientRect()
    mutationObserver = new ResizeObserver(() => {
      const newSize = element.getBoundingClientRect()
      const stuff = this.rects.get(method)
      if (
        (size.width !== newSize.width || size.height !== newSize.height) &&
        stuff
      ) {
        const [box, dims] = this.getSizing(element)
        stuff.values[0]?.rect.updateSize(box, dims, scale, error)
      }
    })

    mutationObserver.observe(element)
    this.rects.set(method, {
      values: [{ rect, element }],
      observer: mutationObserver,
      aborter: new AbortController(),
    })
  }

  getSizing(element: HTMLElement): [Rect, BoxSizing] {
    const outerBox = {
      top: Number.POSITIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
      bottom: Number.NEGATIVE_INFINITY,
      left: Number.POSITIVE_INFINITY,
    }
    const box = getNestedBoundingClientRect({
      node: element,
      boundaryWindow: this.parent,
      offsetElement: this.offsetElement,
    })
    const dims = getElementDimensions(element)

    outerBox.top = Math.min(outerBox.top, box.top)
    outerBox.right = Math.max(outerBox.right, box.left + box.width)
    outerBox.bottom = Math.max(outerBox.bottom, box.top + box.height)
    outerBox.left = Math.min(outerBox.left, box.left)

    return [box, dims]
  }
}

export const overlayStyles = {
  background: '#0094FF',
  error: '#ef4444',
  resize: 'rgba(120, 170, 210, 1)',
  padding: 'rgba(77, 200, 0, 0.3)',
  margin: 'rgba(255, 155, 0, 0.3)',
  border: 'rgba(255, 200, 50, 0.3)',
}

function addAlpha(color: string, opacity: number): string {
  // coerce values so ti is between 0 and 1.
  const _opacity = Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255)
  return color + _opacity.toString(16).toUpperCase()
}

interface InspectorState {
  showingLayoutPanel: boolean
}

interface OverlayProps {
  box: Rect
  dims: BoxSizing
  borderSize: number
  opacity?: number
  error?: boolean
  padding?: boolean
  borderStyle?: 'dotted' | 'dashed'
  drag?: boolean
}
export class OverlayRect {
  node: HTMLElement
  border: HTMLElement
  padding: HTMLElement
  content: HTMLElement
  elementVisibleValue: string | undefined
  resizeHandles: HTMLElement[] = []
  onFlexClick: (() => void) | undefined

  constructor(
    doc: Document,
    private element: HTMLElement,
    container: HTMLElement,
    scale: number,
    private inspectorState: InspectorState,
    onFlexClick?: () => void,
  ) {
    this.node = doc.createElement('div')
    this.border = doc.createElement('div')
    this.padding = doc.createElement('div')
    this.content = doc.createElement('div')

    //const handles = $('[name="resize-handle"]').remove();

    for (let i = 0; i < 8; i++) {
      const handle = $('<div name="resize-handle"></div>')
      this.resizeHandles.push(handle[0])
      this.resizeHandles[i].style.backgroundColor = overlayStyles.resize
    }

    if (element.dataset.harmonyFlex && onFlexClick) {
      this.onFlexClick = () => {
        onFlexClick()
      }
      hotkeys('F', this.onFlexClick)
      const $displayText = $(
        `<div name="harmony-flex-text" class="absolute text-xs right-0 top-0 mr-2 mt-2 text-white rounded-sm px-1 font-ligh pointer-events-auto hover:cursor-pointer hover:bg-opacity-80 data-[harmony-flex=false]:bg-[#64BDFE] data-[harmony-flex=true]:bg-[#0094FF] after:data-[harmony-flex=false]:content-[''] after:data-[harmony-flex=false]:absolute after:data-[harmony-flex=false]:left-0 after:data-[harmony-flex=false]:top-[8px] after:data-[harmony-flex=false]:w-[36px] after:data-[harmony-flex=false]:border-t after:data-[harmony-flex=false]:border-t-white after:data-[harmony-flex=false]:rotate-[22deg] after:data-[harmony-flex=false]:origin-center" data-harmony-flex="${element.dataset.harmonyFlex}">FLEX</div>`,
      )
      $displayText.css('font-size', Math.min(12 / scale, 12))
      $displayText.css(
        'line-height',
        `${Math.min(12 / scale + 4 / scale, 16)}px`,
      )
      $displayText.css('padding-left', Math.min(4 / scale, 4))
      $displayText.css('padding-right', Math.min(4 / scale, 4))
      $displayText.css('margin-right', Math.min(4 / scale, 4))
      $displayText.css('margin-top', Math.min(4 / scale, 4))
      $displayText.on('pointerdown', (e) => {
        e.stopPropagation()
        element.dataset.harmonyFlex =
          element.dataset.harmonyFlex === 'true' ? 'false' : 'true'
        $displayText[0].dataset.harmonyFlex = element.dataset.harmonyFlex
      })
      this.content.appendChild($displayText[0])
    }

    this.border.style.borderColor = overlayStyles.background
    this.padding.style.borderColor = overlayStyles.padding

    Object.assign(this.node.style, {
      borderColor: overlayStyles.margin,
      pointerEvents: 'none',
      position: 'fixed',
    })

    this.node.style.zIndex = '100'

    this.node.appendChild(this.border)
    this.border.appendChild(this.padding)
    this.padding.appendChild(this.content)
    for (const handle of this.resizeHandles) {
      handle.dataset.nonSelectable = 'true' //TODO: find a better way to have this pass the isInteractable method so that the element does not deselect when we select a handle.
      this.content.appendChild(handle)
    }

    // ensure OverlayRect dom always before OverlayTip dom rather than cover OverlayTip
    container.prepend(this.node)
  }

  remove() {
    if (this.node.parentNode) {
      this.node.parentNode.removeChild(this.node)
    }

    if (this.elementVisibleValue !== undefined) {
      this.element.style.visibility = this.elementVisibleValue
    }

    this.onFlexClick && hotkeys.unbind('F', this.onFlexClick)
  }

  public updateSize(box: Rect, dims: BoxSizing, scale: number, error: boolean) {
    dims.borderBottom = 2 / scale
    dims.borderLeft = 2 / scale
    dims.borderRight = 2 / scale
    dims.borderTop = 2 / scale
    this.update({ box, dims, borderSize: 2, error }, scale)
  }

  public hover(box: Rect, dims: BoxSizing, scale: number, error: boolean) {
    dims.borderBottom = 2 / scale
    dims.borderLeft = 2 / scale
    dims.borderRight = 2 / scale
    dims.borderTop = 2 / scale
    if (isTextElement(this.element)) {
      dims.borderLeft = 0
      dims.borderRight = 0
      dims.borderTop = 0
    }
    this.update({ box, dims, borderSize: 2, error }, scale)
  }

  public select(box: Rect, dims: BoxSizing, scale: number, error: boolean) {
    dims.borderBottom = 2 / scale
    dims.borderLeft = 2 / scale
    dims.borderRight = 2 / scale
    dims.borderTop = 2 / scale
    this.update(
      {
        box,
        dims,
        borderSize: 2,
        error,
        drag: false,
        padding: this.inspectorState.showingLayoutPanel,
      },
      scale,
    )
  }

  public update(
    {
      box,
      dims,
      borderSize,
      opacity = 1,
      padding = false,
      borderStyle,
      error = false,
      drag = false,
    }: OverlayProps,
    scale: number,
  ) {
    boxWrap(dims, 'border', this.border)

    boxWrap(dims, 'margin', this.node)
    boxWrap(dims, 'padding', this.padding)

    const resizeThreshold = 30

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

    //NE -> SE -> SW -> NW
    //E -> S -> W -> N
    if (drag) {
      Object.assign(this.resizeHandles[0].style, {
        height: `${6 / scale}px`,
        width: `${6 / scale}px`,
        'pointer-events': 'none',
        cursor: 'nwse-resize',
        position: 'absolute',
        top: `${-dims.borderTop}px`,
        left: `${-dims.borderLeft}px`,
      })

      Object.assign(this.resizeHandles[1].style, {
        height: `${6 / scale}px`,
        width: `${6 / scale}px`,
        'pointer-events': 'none',
        cursor: 'nesw-resize',
        position: 'absolute',
        top: `${box.height - dims.borderTop - dims.borderBottom}px`,
        left: `${-dims.borderLeft}px`,
      })

      Object.assign(this.resizeHandles[2].style, {
        height: `${6 / scale}px`,
        width: `${6 / scale}px`,
        'pointer-events': 'none',
        cursor: 'nwse-resize',
        position: 'absolute',
        top: `${box.height - dims.borderTop - dims.borderBottom}px`,
        left: `${box.width - dims.borderLeft - dims.borderRight}px`,
      })

      Object.assign(this.resizeHandles[3].style, {
        height: `${6 / scale}px`,
        width: `${6 / scale}px`,
        'pointer-events': 'none',
        cursor: 'nesw-resize',
        position: 'absolute',
        top: `${-dims.borderTop}px`,
        left: `${box.width - dims.borderLeft - dims.borderRight}px`,
      })

      const boxHeight = box.height * scale
      if (boxHeight >= resizeThreshold) {
        Object.assign(this.resizeHandles[4].style, {
          height: `${6 / scale}px`,
          width: `${6 / scale}px`,
          'pointer-events': 'none',
          cursor: 'ew-resize',
          position: 'absolute',
          top: `${box.height / 2 - dims.borderTop}px`,
          left: `${-dims.borderLeft}px`,
        })
        //this.resizeHandles[4].addEventListener('mousedown', initFullDrag('w'), false);

        Object.assign(this.resizeHandles[6].style, {
          height: `${6 / scale}px`,
          width: `${6 / scale}px`,
          'pointer-events': 'none',
          cursor: 'ew-resize',
          position: 'absolute',
          top: `${box.height / 2 - dims.borderTop}px`,
          left: `${box.width - dims.borderLeft - dims.borderRight}px`,
        })
        //this.resizeHandles[6].addEventListener('mousedown', initFullDrag('e'), false);
      }

      const boxWidth = box.width * scale
      if (boxWidth >= resizeThreshold) {
        Object.assign(this.resizeHandles[5].style, {
          height: `${6 / scale}px`,
          width: `${6 / scale}px`,
          'pointer-events': 'none',
          cursor: 'ns-resize',
          position: 'absolute',
          top: `${box.height - dims.borderTop - dims.borderBottom}px`,
          left: `${box.width / 2 - dims.borderLeft}px`,
        })
        //this.resizeHandles[5].addEventListener('mousedown', initFullDrag('s'), false);

        Object.assign(this.resizeHandles[7].style, {
          height: `${6 / scale}px`,
          width: `${6 / scale}px`,
          'pointer-events': 'none',
          cursor: 'ns-resize',
          position: 'absolute',
          top: `${-dims.borderTop}px`,
          left: `${box.width / 2 - dims.borderLeft}px`,
        })
        //this.resizeHandles[7].addEventListener('mousedown', initFullDrag('n'), false);
      }
    }

    this.border.style.borderColor = addAlpha(
      error ? overlayStyles.error : overlayStyles.background,
      opacity,
    )
    this.padding.style.borderColor = overlayStyles.padding
    this.node.style.borderColor = overlayStyles.margin
    if (!padding) {
      this.node.style.borderColor = 'transparent'
      this.padding.style.borderColor = 'transparent'
    }

    if (borderStyle) {
      this.border.style.borderStyle = borderStyle
    }

    Object.assign(this.node.style, {
      top: `${box.top - borderSize - dims.marginTop}px`,
      left: `${box.left - borderSize - dims.marginLeft}px`,
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

// Calculate a boundingClientRect for a node relative to boundaryWindow,
// taking into account any offsets caused by intermediate iframes.
interface NestedBoundingClientRectOptions {
  node: HTMLElement
  boundaryWindow?: HTMLElement
  offsetElement?: HTMLElement
}
export function getNestedBoundingClientRect({
  node,
  boundaryWindow,
  offsetElement,
}: NestedBoundingClientRectOptions): Rect {
  const rect = node.getBoundingClientRect()
  const targetRect = {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  }

  if (boundaryWindow) {
    const boundaryRect = boundaryWindow.getBoundingClientRect()

    const boundaryStyle = window.getComputedStyle(boundaryWindow)
    const transformMatrix = new DOMMatrix(boundaryStyle.transform)

    // Extract the scaling factors from the transform matrix
    const scaleX = transformMatrix.a
    const scaleY = transformMatrix.d

    //There is a bug where the boundaryWindow is messed up on scrolling in a non-zoomable container, so just return
    if (scaleX === 1 && scaleY === 1) return targetRect

    if (offsetElement) {
      targetRect.top *= scaleY
      targetRect.left *= scaleX
      targetRect.right *= scaleX
      targetRect.bottom *= scaleY
      targetRect.width *= scaleX
      targetRect.height *= scaleY

      const offsetRect = offsetElement.getBoundingClientRect()
      targetRect.top += offsetRect.top
      targetRect.left += offsetRect.left
      targetRect.right += offsetRect.left
      targetRect.bottom += offsetRect.top
    }

    // Calculate the relative position
    const relativePosition = {
      top: (targetRect.top - boundaryRect.top) / scaleY,
      left: (targetRect.left - boundaryRect.left) / scaleX,
      right: (targetRect.right - boundaryRect.left) / scaleX,
      bottom: (targetRect.bottom - boundaryRect.top) / scaleY,
      width: targetRect.width / scaleX,
      height: targetRect.height / scaleY,
    }

    return relativePosition
  }

  return targetRect
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
