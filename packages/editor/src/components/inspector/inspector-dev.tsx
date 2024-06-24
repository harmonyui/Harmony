'use client'

import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect as _useLayoutEffect,
  useMemo,
} from 'react'
import type { MutableRefObject, ReactNode } from 'react'
import type { Fiber, Source } from 'react-reconciler'
import hotkeys from 'hotkeys-js'

export const useEffectEvent = <T extends (...args: any[]) => any>(
  callback?: T,
) => {
  const callbackRef = useRef(callback)

  /**
   * same as modify ref value in `useEffect`, use for avoid tear of layout update
   */
  callbackRef.current = useMemo(() => callback, [callback])

  const stableRef = useRef<T>()

  // init once
  if (!stableRef.current) {
    stableRef.current = function (this: ThisParameterType<T>, ...args) {
      return callbackRef.current?.apply(this, args)
    } as T
  }

  return stableRef.current
}

export const useLayoutEffect =
  typeof window !== 'undefined' &&
  // @ts-expect-error `window` is not available in SSR
  window.document.createElement
    ? _useLayoutEffect
    : useEffect

export const useMousePosition = ({
  disable,
}: {
  disable?: boolean
}): MutableRefObject<{ x: number; y: number }> => {
  const mouseRef = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })

  const recordMousePoint = (ev: MouseEvent) => {
    mouseRef.current.x = ev.clientX
    mouseRef.current.y = ev.clientY
  }

  useEffect(() => {
    if (!disable) {
      document.addEventListener('mousemove', recordMousePoint, true)
    }

    return () => {
      document.removeEventListener('mousemove', recordMousePoint, true)
    }
  }, [disable])

  return mouseRef
}

/**
 * the inspect meta info that is sent to the callback when an element is hovered over or clicked.
 */
export interface InspectParams {
  /** hover / click event target dom element */
  element: HTMLElement
  /** nearest named react component fiber for dom element */
  fiber?: Fiber
  /** source file line / column / path info for react component */
  codeInfo?: CodeInfo
  /** react component name for dom element */
  name?: string
}

/**
 * `v2.0.0` changes:
 *   - make 'Ctrl + Shift + Alt + C' as default shortcut on Windows/Linux
 *   - export `defaultHotkeys`
 */
export const defaultHotkeys = () =>
  navigator.platform.startsWith('Mac')
    ? ['Ctrl', 'Shift', 'Command', 'C']
    : ['Ctrl', 'Shift', 'Alt', 'C']

export interface InspectorProps {
  /**
   * Inspector Component toggle hotkeys,
   *
   * supported keys see: https://github.com/jaywcjlove/hotkeys#supported-keys
   *
   * @default - `['Ctrl', 'Shift', 'Command', 'C']` on macOS, `['Ctrl', 'Shift', 'Alt', 'C']` on other platforms.
   *
   * Setting `keys={null}` explicitly means that disable use hotkeys to trigger it.
   */
  keys?: string[] | null

  /**
   * If setting `active` prop, the Inspector will be a Controlled React Component,
   *   you need to control the `true`/`false` state to active the Inspector.
   *
   * If not setting `active` prop, this only a Uncontrolled component that
   *   will activate/deactivate by hotkeys.
   *
   * > add in version `v2.0.0`
   */
  active?: boolean

  /**
   * Trigger by `active` state change, includes:
   * - hotkeys toggle, before activate/deactivate Inspector
   * - Escape / Click, before deactivate Inspector
   *
   * will NOT trigger by `active` prop change.
   *
   * > add in version `v2.0.0`
   */
  onActiveChange?: (active: boolean) => void

  /**
   * Whether to disable all behavior include hotkeys listening or trigger,
   * will automatically disable in production environment by default.
   *
   * @default `true` if `NODE_ENV` is 'production', otherwise is `false`.
   * > add in version `v2.0.0`
   */
  disable?: boolean

  /**
   * Callback when left-clicking on an element, with ensuring the source code info is found.
   *
   * By setting the `onInspectElement` prop, the default behavior ("open local IDE") will be disabled,
   *   that means you want to manually handle the source info, or handle how to goto editor by yourself.
   *
   * You can also use builtin `gotoServerEditor` utils in `onInspectElement` to get origin behavior ("open local IDE on server-side"),
   *   it looks like:
   *
   * ```tsx
   * import { Inspector, gotoServerEditor } from 'react-dev-inspector'
   *
   * <Inspector
   *   onInspectElement={({ codeInfo }) => {
   *     ...; // your processing
   *     gotoServerEditor(codeInfo)
   *   }}
   * </Inspector>
   * ```
   *
   * > add in version `v2.0.0`
   */
  onInspectElement?: (params: Required<InspectParams>) => void

  /** Callback when hovering on an element */
  onHoverElement?: (params: InspectParams) => void

  /**
   * Callback when left-clicking on an element.
   */
  onClickElement?: (params: InspectParams) => void

  /** any children of react nodes */
  children?: ReactNode

  /**
   * Whether to disable default behavior: "launch to local IDE when click on component".
   *
   * @default `true` if setting `onInspectElement` callback, otherwise is `false`.
   * @deprecated please use `onInspectElement` callback instead for fully custom controlling.
   */
  disableLaunchEditor?: boolean
}

export const Inspector = (props: InspectorProps) => {
  const {
    keys,
    onHoverElement,
    onClickElement,
    onInspectElement,
    active: controlledActive,
    onActiveChange,
    disableLaunchEditor,
    disable = process.env.NODE_ENV !== 'development',
    children,
  } = props

  const [isActive, setActive] = useState<boolean>(controlledActive ?? false)

  // sync state as controlled component
  useLayoutEffect(() => {
    if (controlledActive !== undefined) {
      setActive(controlledActive)
    }
  }, [controlledActive])

  useEffect(() => {
    isActive ? startInspect() : null

    return stopInspect
  }, [isActive])

  // hotkeys-js params need string
  const hotkey: string | null = keys === null ? null : (keys ?? []).join('+')

  /** inspector tooltip overlay */
  //const overlayRef = useRef<Overlay>()
  const mouseRef = useMousePosition({ disable })

  const activate = useEffectEvent(() => {
    onActiveChange?.(true)
    if (controlledActive === undefined) {
      setActive(true)
    }
  })

  const deactivate = useEffectEvent(() => {
    onActiveChange?.(false)
    if (controlledActive === undefined) {
      setActive(false)
    }
  })

  const startInspect = useEffectEvent(() => {
    // if (overlayRef.current || disable) return

    // const overlay = new Overlay()
    // overlayRef.current = overlay

    hotkeys(`esc`, deactivate)

    const stopCallback = setupHighlighter({
      onPointerOver: handleHoverElement,
      onClick: handleClickElement,
    })

    //overlay.setRemoveCallback(stopCallback)

    // inspect element immediately at mouse point
    const initPoint = mouseRef.current
    const initElement = document.elementFromPoint(initPoint.x, initPoint.y)
    if (initElement) handleHoverElement(initElement as HTMLElement)
  })

  const stopInspect = useEffectEvent(() => {
    // overlayRef.current?.remove()
    // overlayRef.current = undefined

    hotkeys.unbind(`esc`, deactivate)
  })

  const handleHoverElement = useEffectEvent((element: HTMLElement) => {
    //const overlay = overlayRef.current

    const codeInfo = getElementCodeInfo(element)
    const relativePath = codeInfo?.relativePath
    const absolutePath = codeInfo?.absolutePath

    const { fiber, name, title } = getElementInspect(element)

    //overlay?.inspect?.([element], title, relativePath ?? absolutePath)

    onHoverElement?.({
      element,
      fiber,
      codeInfo,
      name,
    })
  })

  const handleClickElement = useEffectEvent((element: HTMLElement) => {
    if (controlledActive === undefined) deactivate()

    const codeInfo = getElementCodeInfo(element)
    const { fiber, name } = getElementInspect(element)

    onClickElement?.({
      element,
      fiber,
      codeInfo,
      name,
    })

    if (fiber && codeInfo) {
      onInspectElement?.({
        element,
        fiber,
        codeInfo,
        name: name!,
      })

      // if (!onInspectElement && !disableLaunchEditor) {
      //   gotoServerEditor(codeInfo)
      // }
    }
  })

  useEffect(() => {
    const handleHotKeys = () => {
      // overlayRef.current
      //   ? deactivate()
      //   : activate()
    }

    const bindKey =
      hotkey === null || disable ? null : hotkey || defaultHotkeys().join('+')

    if (bindKey) {
      // https://github.com/jaywcjlove/hotkeys
      hotkeys(bindKey, handleHotKeys)

      return () => {
        hotkeys.unbind(bindKey, handleHotKeys)
      }
    }
  }, [hotkey, disable])

  return <>{children ?? null}</>
}

let iframesListeningTo = new Set<HTMLIFrameElement>()

export type StopFunction = () => void

export function setupHighlighter(handlers: {
  onPointerOver?: (element: HTMLElement) => void
  onClick?: (element: HTMLElement) => void
}): StopFunction {
  function startInspectingNative() {
    registerListenersOnWindow(window)
  }

  function registerListenersOnWindow(window?: Window | null) {
    // This plug-in may run in non-DOM environments (e.g. React Native).
    if (window && typeof window.addEventListener === 'function') {
      window.addEventListener('click', onClick, true)
      window.addEventListener('mousedown', onMouseEvent, true)
      window.addEventListener('mouseover', onMouseEvent, true)
      window.addEventListener('mouseup', onMouseEvent, true)
      window.addEventListener('pointerdown', onPointerDown, true)
      window.addEventListener('pointerover', onPointerOver, true)
      window.addEventListener('pointerup', onPointerUp, true)
    }
  }

  function stopInspectingNative() {
    removeListenersOnWindow(window)
    iframesListeningTo.forEach((frame) => {
      try {
        removeListenersOnWindow(frame.contentWindow)
      } catch (error) {
        // This can error when the iframe is on a cross-origin.
      }
    })
    iframesListeningTo = new Set()
  }

  function removeListenersOnWindow(window?: Window | null) {
    // This plug-in may run in non-DOM environments (e.g. React Native).
    if (window && typeof window.removeEventListener === 'function') {
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('mousedown', onMouseEvent, true)
      window.removeEventListener('mouseover', onMouseEvent, true)
      window.removeEventListener('mouseup', onMouseEvent, true)
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('pointerover', onPointerOver, true)
      window.removeEventListener('pointerup', onPointerUp, true)
    }
  }

  function onClick(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()

    stopInspectingNative()

    handlers.onClick?.(event.target as HTMLElement)
  }

  function onMouseEvent(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
  }

  function onPointerDown(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
  }

  function onPointerOver(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()

    const target = event.target as HTMLElement

    if (target.tagName === 'IFRAME') {
      const iframe: HTMLIFrameElement = target as HTMLIFrameElement
      try {
        if (!iframesListeningTo.has(iframe)) {
          const window = iframe.contentWindow
          registerListenersOnWindow(window)
          iframesListeningTo.add(iframe)
        }
      } catch (error) {
        // This can error when the iframe is on a cross-origin.
      }
    }

    handlers.onPointerOver?.(event.target as HTMLElement)
  }

  function onPointerUp(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
  }

  startInspectingNative()

  return stopInspectingNative
}

/**
 * only native html tag fiber's type will be string,
 * all the others (component / functional component / context) type will be function or object
 */
export const isNativeTagFiber = (fiber?: Fiber): boolean =>
  typeof fiber?.type === 'string'

/**
 * react fiber symbol types see:
 * https://github.com/facebook/react/blob/v17.0.0/packages/shared/ReactSymbols.js#L39-L58
 */
export const isReactSymbolFiber = (fiber?: Fiber): boolean =>
  typeof fiber?.type?.$$typeof === 'symbol'

export const isForwardRef = (fiber?: Fiber): boolean =>
  fiber?.type?.$$typeof === Symbol.for('react.forward_ref')

export type FiberHTMLElement = HTMLElement & Record<string, Fiber | undefined>

/**
 * https://stackoverflow.com/questions/29321742/react-getting-a-component-from-a-dom-element-for-debugging
 */
export const getElementFiber = (
  element: FiberHTMLElement,
): Fiber | undefined => {
  const fiberKey = Object.keys(element).find(
    (key) =>
      /**
       * for react <= v16.13.1
       * https://github.com/facebook/react/blob/v16.13.1/packages/react-dom/src/client/ReactDOMComponentTree.js#L21
       */
      key.startsWith('__reactInternalInstance$') ||
      /**
       * for react >= v16.14.0
       * https://github.com/facebook/react/blob/v16.14.0/packages/react-dom/src/client/ReactDOMComponentTree.js#L39
       */
      key.startsWith('__reactFiber$'),
  )

  if (fiberKey) {
    return element[fiberKey]!
  }

  return undefined
}

export const getElementFiberUpward = (
  element: HTMLElement | null,
): Fiber | undefined => {
  if (!element) return undefined
  const fiber = getElementFiber(element as FiberHTMLElement)
  if (fiber) return fiber
  return getElementFiberUpward(element.parentElement)
}

/**
 * find first parent of native html tag or react component,
 * skip react Provider / Context / ForwardRef / Fragment etc.
 */
export const getDirectParentFiber = (child: Fiber): Fiber | null => {
  let current = child.return
  while (current) {
    /**
     * react fiber symbol types see:
     * https://github.com/facebook/react/blob/v17.0.0/packages/shared/ReactSymbols.js#L39-L58
     */
    if (!isReactSymbolFiber(current)) {
      return current
    }
    current = current.return
  }
  return null
}

/**
 * The displayName property is not guaranteed to be a string.
 * It's only safe to use for our purposes if it's a string.
 * github.com/facebook/react-devtools/issues/803
 *
 * https://github.com/facebook/react/blob/v17.0.0/packages/react-devtools-shared/src/utils.js#L90-L112
 */
export const getFiberName = (fiber?: Fiber): string | undefined => {
  const fiberType = fiber?.type
  if (!fiberType) return undefined
  const { displayName, name } = fiberType

  if (typeof displayName === 'string') {
    return displayName
  } else if (typeof name === 'string') {
    return name
  } else if (typeof fiberType === 'string') {
    return fiberType
  }

  return undefined
}

export interface CodeInfo {
  lineNumber: string
  columnNumber: string
  /**
   * code source file relative path to dev-server cwd(current working directory)
   * need use with `react-dev-inspector/plugins/babel`
   */
  relativePath?: string
  /**
   * code source file absolute path
   * just need use with `@babel/plugin-transform-react-jsx-source` which auto set by most framework
   */
  absolutePath?: string
}

/**
 * props that injected into react nodes
 *
 * like <div data-inspector-line="2" data-inspector-column="3" data-inspector-relative-path="xxx/ooo" />
 * this props will be record in fiber
 */
export interface CodeDataAttribute {
  'data-inspector-line': string
  'data-inspector-column': string
  'data-inspector-relative-path': string
}

/**
 * react fiber property `_debugSource` created by `@babel/plugin-transform-react-jsx-source`
 *     https://github.com/babel/babel/blob/v7.16.4/packages/babel-plugin-transform-react-jsx-source/src/index.js
 *
 * and injected `__source` property used by `React.createElement`, then pass to `ReactElement`
 *     https://github.com/facebook/react/blob/v18.0.0/packages/react/src/ReactElement.js#L189
 *     https://github.com/facebook/react/blob/v18.0.0/packages/react/src/ReactElement.js#L389
 *     https://github.com/facebook/react/blob/v18.0.0/packages/react/src/ReactElement.js#L447
 *
 * finally, used by `createFiberFromElement` to become a fiber property `_debugSource`.
 *     https://github.com/facebook/react/blob/v18.0.0/packages/react-reconciler/src/ReactFiber.new.js#L648-L649
 */
export const getCodeInfoFromDebugSource = (
  fiber?: Fiber,
): CodeInfo | undefined => {
  if (!fiber?._debugSource) return undefined

  const { fileName, lineNumber, columnNumber } =
    fiber._debugSource as Source & { columnNumber?: number }

  if (fileName && lineNumber) {
    return {
      lineNumber: String(lineNumber),
      columnNumber: String(columnNumber ?? 1),

      /**
       * `fileName` in `_debugSource` is absolutely
       * ---
       *
       * compatible with the incorrect `fileName: "</xxx/file>"` by [rspack](https://github.com/web-infra-dev/rspack)
       */
      absolutePath: /^<.*>$/.exec(fileName)
        ? fileName.replace(/^<|>$/g, '')
        : fileName,
    }
  }

  return undefined
}

/**
 * code location data-attribute props inject by `react-dev-inspector/plugins/babel`
 */
export const getCodeInfoFromProps = (fiber?: Fiber): CodeInfo | undefined => {
  if (!fiber?.pendingProps) return undefined

  const {
    'data-inspector-line': lineNumber,
    'data-inspector-column': columnNumber,
    'data-inspector-relative-path': relativePath,
  } = fiber.pendingProps as CodeDataAttribute

  if (lineNumber && columnNumber && relativePath) {
    return {
      lineNumber,
      columnNumber,
      relativePath,
    }
  }

  return undefined
}

export const getCodeInfoFromFiber = (fiber?: Fiber): CodeInfo | undefined =>
  getCodeInfoFromProps(fiber) ?? getCodeInfoFromDebugSource(fiber)

/**
 * give a `base` dom fiber,
 * and will try to get the human friendly react component `reference` fiber from it;
 *
 * rules and examples see below:
 * *******************************************************
 *
 * if parent is html native tag, `reference` is considered to be as same as `base`
 *
 *  div                                       div
 *    └─ h1                                     └─ h1  (<--base) <--reference
 *      └─ span  (<--base) <--reference           └─ span
 *
 * *******************************************************
 *
 * if parent is NOT html native tag,
 *   and parent ONLY have one child (the `base` itself),
 *   then `reference` is considered to be the parent.
 *
 *  Title  <--reference                       Title
 *    └─ h1  (<--base)                          └─ h1  (<--base) <--reference
 *      └─ span                                 └─ span
 *                                              └─ div
 *
 * *******************************************************
 *
 * while follow the last one,
 *   "parent" is considered to skip continuous Provider/Customer/ForwardRef components
 *
 *  Title  <- reference                       Title  <- reference
 *    └─ TitleName [ForwardRef]                 └─ TitleName [ForwardRef]
 *      └─ Context.Customer                       └─ Context.Customer
 *         └─ Context.Customer                      └─ Context.Customer
 *          └─ h1  (<- base)                          └─ h1  (<- base)
 *            └─ span                             └─ span
 *                                                └─ div
 *
 *  Title
 *    └─ TitleName [ForwardRef]
 *      └─ Context.Customer
 *         └─ Context.Customer
 *          └─ h1  (<- base) <- reference
 *    └─ span
 *    └─ div
 */
export const getReferenceFiber = (baseFiber?: Fiber): Fiber | undefined => {
  if (!baseFiber) return undefined

  const directParent = getDirectParentFiber(baseFiber)
  if (!directParent) return undefined

  const isParentNative = isNativeTagFiber(directParent)
  const isOnlyOneChild = !directParent.child?.sibling

  let referenceFiber =
    !isParentNative && isOnlyOneChild ? directParent : baseFiber

  // fallback for cannot find code-info fiber when traverse to root
  const originReferenceFiber = referenceFiber

  while (referenceFiber) {
    if (getCodeInfoFromFiber(referenceFiber)) return referenceFiber

    referenceFiber = referenceFiber.return!
  }

  return originReferenceFiber
}

export const getElementCodeInfo = (
  element: HTMLElement,
): CodeInfo | undefined => {
  const fiber: Fiber | undefined = getElementFiberUpward(element)

  const referenceFiber = getReferenceFiber(fiber)
  return getCodeInfoFromFiber(referenceFiber)
}

export const getNamedFiber = (baseFiber?: Fiber): Fiber | undefined => {
  let fiber = baseFiber

  // fallback for cannot find code-info fiber when traverse to root
  let originNamedFiber: Fiber | undefined

  while (fiber) {
    let parent = fiber.return ?? undefined
    let forwardParent: Fiber | undefined

    while (isReactSymbolFiber(parent)) {
      if (isForwardRef(parent)) {
        forwardParent = parent
      }
      parent = parent?.return ?? undefined
    }

    if (forwardParent) {
      fiber = forwardParent
    }

    if (getFiberName(fiber)) {
      if (!originNamedFiber) originNamedFiber = fiber

      if (getCodeInfoFromFiber(fiber)) return fiber
    }

    fiber = parent!
  }

  return originNamedFiber
}

export const getElementInspect = (
  element: HTMLElement,
): {
  fiber?: Fiber
  name?: string
  title: string
} => {
  const fiber = getElementFiberUpward(element)
  const referenceFiber = getReferenceFiber(fiber)

  const namedFiber = getNamedFiber(referenceFiber)

  const fiberName = getFiberName(namedFiber)
  const nodeName = element.nodeName.toLowerCase()

  const title = fiberName ? `${nodeName} in <${fiberName}>` : nodeName

  return {
    fiber: referenceFiber,
    name: fiberName,
    title,
  }
}
