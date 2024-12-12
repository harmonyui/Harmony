/* eslint-disable @typescript-eslint/prefer-for-of -- ok*/
import $ from 'jquery'
import { capitalizeFirstLetter } from '@harmony/util/src/utils/common'

/* eslint-disable @typescript-eslint/no-non-null-assertion --- ok*/
export const recurseElements = (
  element: HTMLElement,
  callbacks: ((
    element: HTMLElement,
    parentElement: HTMLElement | undefined,
  ) => void)[],
  parent?: HTMLElement,
  text = false,
) => {
  callbacks.forEach((callback) => {
    callback(element, parent)
  })
  Array.from(element.children)
    .filter((child) =>
      text ? true : (child as HTMLElement).dataset.harmonyText !== 'true',
    )
    .forEach((child) => {
      recurseElements(child as HTMLElement, callbacks, element, text)
    })
}

export function findElementFromId(
  componentId: string,
  childIndex: number,
  rootElement: HTMLElement | undefined,
): HTMLElement | undefined {
  const selector = `[data-harmony-id="${componentId}"][data-harmony-child-index="${childIndex}"]`
  if (!rootElement) {
    throw new Error('Cannot find root element')
  }
  const elements = rootElement.querySelectorAll(selector)
  if (elements.length > 0) {
    return elements[0] as HTMLElement
  }

  return undefined
}

export function findElementsFromId(
  componentId: string,
  rootElement: HTMLElement | undefined,
): HTMLElement[] {
  const selector = `[data-harmony-id="${componentId}"]`
  const container = rootElement
  if (!container) {
    throw new Error('Cannot find container harmony-container')
  }
  const elements = container.querySelectorAll(selector)
  return Array.from(elements) as HTMLElement[]
}

export function findSameElementsFromId(
  componentId: string,
  rootElement: HTMLElement | undefined,
): HTMLElement[] {
  const selector = `[data-harmony-component-id="${componentId}"]`
  const container = rootElement
  if (!container) {
    throw new Error('Cannot find container harmony-container')
  }
  const elements = container.querySelectorAll(selector)
  return Array.from(elements) as HTMLElement[]
}

export function getComponentIdAndChildIndex(component: HTMLElement): {
  childIndex: number
  componentId: string
  index: number
} {
  let componentId = component.dataset.harmonyId
  let index = 0
  let childIndex = Number(component.dataset.harmonyChildIndex)

  if (!componentId) {
    if (component.dataset.harmonyText === 'true') {
      const element = component.parentElement
      if (!element) {
        throw new Error('Error when getting component parent in harmony text')
      }
      index = Array.from(element.children).indexOf(component)
      childIndex = Number(element.dataset.harmonyChildIndex)
      componentId = element.dataset.harmonyId
    }

    if (!componentId || index < 0) {
      throw new Error('Error when getting component')
    }
  }

  if (childIndex < 0) throw new Error('Cannot get right child index')

  return { childIndex, componentId, index }
}

export function getComponentId(
  component: HTMLElement | undefined,
): string | undefined {
  if (!component) return undefined

  return getComponentIdAndChildIndex(component).componentId
}

export const createComponentId = (element: HTMLElement): string => {
  const actualElement =
    element.dataset.harmonyText === 'true' ? element.parentElement! : element
  if (actualElement.id !== '') {
    return btoa(`#${actualElement.id}`)
  }
  const path: string[] = []
  let currElement = actualElement
  while (currElement.parentElement) {
    let tagName = currElement.tagName.toLowerCase()
    if (currElement.id) {
      tagName += `#${currElement.id}`
    }
    // else if (currElement.className) {
    //   tagName += `.${currElement.className.split(' ').join('.')}`
    // }
    else {
      const siblings = Array.from(currElement.parentElement.children)
      const index = siblings.indexOf(currElement) + 1
      tagName += `;nth-child(${index})`
    }
    path.unshift(tagName)
    currElement = currElement.parentElement
  }
  return btoa(path.join(' > '))
}

export const getImageSrc = (image: HTMLImageElement): string => {
  const result = /<img[^>]*\s+src=['"]([^'"]+)['"]/.exec(image.outerHTML)
  if (result) {
    return result[1]
  }

  return ''
}

export const getElementText = (element: HTMLElement): string => {
  if (element.dataset.harmonyText === 'true') {
    return element.textContent || ''
  }

  return element.innerText
}

export const translatePropertyName = (name: string): string => {
  switch (name) {
    case 'src':
      return 'Source'
    case 'href':
      return 'URL'
    default:
      return name
  }
}

export interface StyleInfo {
  selectors: {
    selector: string
    class: string
    styles: {
      name: string
      value: string
    }[]
    cssText: string
  }[]
  variables: {
    name: string
    value: string
    selector: string
  }[]
  keyframes: {
    name: string
    text: string
  }[]
}
export const getStyleInfo = (): StyleInfo => {
  const stylesheets = Array.from(document.styleSheets)
  const styleInfo: StyleInfo = {
    selectors: [],
    keyframes: [],
    variables: [],
  }

  const extractCSSStyle = (rule: CSSRule) => {
    if (rule instanceof CSSStyleRule) {
      const style: StyleInfo['selectors'][number] = {
        selector: rule.selectorText,
        styles: [],
        class: '',
        cssText: rule.cssText,
      }
      for (let i = 0; i < rule.style.length; i++) {
        const name = rule.style[i]
        const value = rule.style.getPropertyValue(name)
        style.styles.push({ name, value })
        if (name.startsWith('--')) {
          styleInfo.variables.push({
            name,
            value,
            selector: rule.selectorText,
          })
        }
      }
      styleInfo.selectors.push(style)
    } else if (rule instanceof CSSMediaRule) {
      const mediaRules = Array.from(rule.cssRules)
      for (const mediaRule of mediaRules) {
        extractCSSStyle(mediaRule)
      }
    } else if (rule instanceof CSSKeyframesRule) {
      styleInfo.keyframes.push({ name: rule.name, text: rule.cssText })
    }
  }

  for (const stylesheet of stylesheets) {
    try {
      const rules = Array.from(stylesheet.cssRules)

      for (const rule of rules) {
        extractCSSStyle(rule)
      }
    } catch {
      continue
    }
  }
  return styleInfo
}
export const getStyleInfoForElement = (
  element: HTMLElement,
  info?: StyleInfo,
): StyleInfo => {
  const styleInfo = info ?? getStyleInfo()

  const infoForElement: StyleInfo = {
    selectors: [],
    keyframes: [],
    variables: [],
  }
  const computedStyles = getComputedStyle(element)
  for (const selector of styleInfo.selectors) {
    if (element.matches(selector.selector) || selector.selector === ':root') {
      const styles = selector.styles.map((style) => {
        const value = style.value
          ? style.value
          : computedStyles.getPropertyValue(style.name)
        if (style.name === 'animation-name') {
          const animationName = value
          const keyframe = styleInfo.keyframes.find(
            (frame) => frame.name === animationName,
          )
          if (keyframe) {
            infoForElement.keyframes.push(keyframe)
          }
        }

        return {
          name: style.name,
          value,
        }
      })

      const sameClasses = Array.from(element.classList).filter((c) =>
        selector.selector.includes(`.${c}`),
      )
      infoForElement.selectors.push({
        ...selector,
        class: sameClasses.join(' '),
        styles,
      })
      const variables = selector.styles.filter((v) => v.name.startsWith('--'))
      infoForElement.variables.push(
        ...variables.map((v) => ({
          name: v.name,
          value: v.value,
          selector: selector.selector,
        })),
      )
    }
  }

  return infoForElement
}

export const getProperty = (
  element: HTMLElement,
  property: 'margin' | 'border' | 'padding',
  type: 'top' | 'bottom' | 'left' | 'right',
) => {
  const upper = capitalizeFirstLetter(type)
  return parseFloat($(element).css(`${property}${upper}`) || '0') // + parseFloat($(element).css(`border${upper}`) || '0');
}

export const getComputedValue = (
  element: HTMLElement | StylePropertyMapReadOnly,
  property: string,
): string => {
  const styleMap =
    'computedStyleMap' in element ? element.computedStyleMap() : element
  const styleValue = styleMap.get(property)
  if (!styleValue) return ''

  if (styleValue instanceof CSSKeywordValue) {
    return styleValue.value
  }
  return styleValue.toString()
}

interface RectSize {
  width: number
  height: number
}

export const isDesignerElementSelectable = (
  element: HTMLElement | null,
): element is HTMLElement => {
  if (!element) return false

  const getClientSize = (
    _element: HTMLElement,
    withBorder = false,
  ): RectSize => {
    const width =
      _element.clientWidth +
      (withBorder
        ? getProperty(_element, 'border', 'left') +
          getProperty(_element, 'border', 'right')
        : 0)
    const height =
      _element.clientHeight +
      (withBorder
        ? getProperty(_element, 'border', 'top') +
          getProperty(_element, 'border', 'bottom')
        : 0)

    return { width, height }
  }

  const sizesAreEqual = (size1: RectSize, size2: RectSize): boolean => {
    return size1.width === size2.width && size1.height === size2.height
  }

  return (
    element.children.length === 1 &&
    (['bottom', 'top', 'left', 'right'] as const).every(
      (d) => getProperty(element, 'padding', d) === 0,
    ) &&
    sizesAreEqual(
      getClientSize(element.children[0] as HTMLElement, true),
      getClientSize(element),
    )
  )
}

//Returns the element as understood from a designer (no nested containers with one child and no padding)
export function selectDesignerElement(element: HTMLElement): HTMLElement {
  let target = element

  while (isDesignerElementSelectable(target.parentElement)) {
    target = target.parentElement
  }

  return target
}

export function selectDesignerElementReverse(
  element: HTMLElement,
): HTMLElement {
  const isDesignerSelected =
    element.children.length === 1 &&
    selectDesignerElement(element.children[0] as HTMLElement) === element
  return isDesignerSelected ? (element.children[0] as HTMLElement) : element
}
