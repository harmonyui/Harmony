import type { Fiber, Source } from 'react-reconciler'

export type FiberHTMLElement = HTMLElement & Record<string, Fiber | undefined>

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

export const getElementFiber = (
  element: FiberHTMLElement,
): Fiber | undefined => {
  const fiberKey = Object.keys(element).find(
    (key) =>
      /**
       * for react \<= v16.13.1
       * https://github.com/facebook/react/blob/v16.13.1/packages/react-dom/src/client/ReactDOMComponentTree.js#L21
       */
      key.startsWith('__reactInternalInstance$') ||
      /**
       * for react \>= v16.14.0
       * https://github.com/facebook/react/blob/v16.14.0/packages/react-dom/src/client/ReactDOMComponentTree.js#L39
       */
      key.startsWith('__reactFiber$'),
  )

  if (fiberKey) {
    return element[fiberKey]
  }

  return undefined
}

/**
 * The displayName property is not guaranteed to be a string.
 * It's only safe to use for our purposes if it's a string.
 * github.com/facebook/react-devtools/issues/803
 *
 * https://github.com/facebook/react/blob/v17.0.0/packages/react-devtools-shared/src/utils.js#L90-L112
 */
export const getFiberName = (fiber?: Fiber): string | undefined => {
  const fiberType = fiber?.type as
    | { displayName?: string; name?: string }
    | string
  if (!fiberType) return undefined
  if (typeof fiberType === 'string') return fiberType

  const { displayName, name } = fiberType

  if (typeof displayName === 'string') {
    return displayName
  } else if (typeof name === 'string') {
    return name
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
 * react fiber symbol types see:
 * https://github.com/facebook/react/blob/v17.0.0/packages/shared/ReactSymbols.js#L39-L58
 */
export const isReactSymbolFiber = (fiber?: Fiber): boolean =>
  typeof (fiber?.type as { $$typeof: string } | undefined)?.$$typeof ===
  'symbol'

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
 *    └─ h1                                     └─ h1  (\<--base) \<--reference
 *      └─ span  (\<--base) \<--reference           └─ span
 *
 * *******************************************************
 *
 * if parent is NOT html native tag,
 *   and parent ONLY have one child (the `base` itself),
 *   then `reference` is considered to be the parent.
 *
 *  Title  \<--reference                       Title
 *    └─ h1  (\<--base)                          └─ h1  (\<--base) \<--reference
 *      └─ span                                 └─ span
 *                                              └─ div
 *
 * *******************************************************
 *
 * while follow the last one,
 *   "parent" is considered to skip continuous Provider/Customer/ForwardRef components
 *
 *  Title  \<- reference                       Title  \<- reference
 *    └─ TitleName [ForwardRef]                 └─ TitleName [ForwardRef]
 *      └─ Context.Customer                       └─ Context.Customer
 *         └─ Context.Customer                      └─ Context.Customer
 *          └─ h1  (\<- base)                          └─ h1  (\<- base)
 *            └─ span                             └─ span
 *                                                └─ div
 *
 *  Title
 *    └─ TitleName [ForwardRef]
 *      └─ Context.Customer
 *         └─ Context.Customer
 *          └─ h1  (\<- base) \<- reference
 *    └─ span
 *    └─ div
 */
export const getReferenceFiber = (baseFiber?: Fiber): Fiber | undefined => {
  if (!baseFiber) return undefined

  const directParent = getDirectParentFiber(baseFiber)
  if (!directParent) return undefined

  const isParentNative = isNativeTagFiber(directParent)
  const isOnlyOneChild = !directParent.child?.sibling

  let referenceFiber: Fiber | null =
    !isParentNative && isOnlyOneChild ? directParent : baseFiber

  // fallback for cannot find code-info fiber when traverse to root
  const originReferenceFiber = referenceFiber

  while (referenceFiber) {
    if (getCodeInfoFromFiber(referenceFiber)) return referenceFiber

    referenceFiber = referenceFiber.return
  }

  return originReferenceFiber
}

/**
 * only native html tag fiber's type will be string,
 * all the others (component / functional component / context) type will be function or object
 */
export const isNativeTagFiber = (fiber?: Fiber): boolean =>
  typeof fiber?.type === 'string'

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
