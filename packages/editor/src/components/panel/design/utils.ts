import type { HarmonyComponentInfo } from '@harmony/util/src/types/component'
import { areHexColorsEqual } from '@harmony/util/src/utils/common'
import type { HexColor } from '@harmony/util/src/types/colors'
import { getElementText } from '../../../utils/element-utils'
import type { ComponentElement } from '../../inspector/component-identifier'
import type { CommonTools } from '../../attributes/types'
import { colorTools, ComponentType } from '../../attributes/types'
import { isTextElement } from '../../../utils/element-predicate'

export const getComponentType = (
  element: HTMLElement,
  harmonyComponents: HarmonyComponentInfo[],
): ComponentType => {
  const componentId = element.dataset.harmonyId
  const component = harmonyComponents.find((cmp) => cmp.id === componentId)
  if (component && component.isComponent) {
    return ComponentType.Component
  }

  const tagName = element.tagName.toLowerCase()
  if (isTextElement(element)) {
    return ComponentType.Text
  }
  if (['svg', 'img'].includes(tagName)) {
    return ComponentType.Shape
  }

  return ComponentType.Frame
}

export const getComponentName = (component: ComponentElement): string => {
  const elementNameToComponentNameMapping: Record<string, string> = {
    img: 'Image',
    svg: 'SVG',
    p: 'Paragraph',
    h1: 'Heading 1',
    a: 'Link',
    div: 'Frame',
    nav: 'Navigation',
    header: 'Header',
    ul: 'List',
  }
  if (component.name[0].toUpperCase() === component.name[0]) {
    return component.name
  }

  const type = getComponentType(component.element, [])
  if (type === ComponentType.Text) {
    return getElementText(component.element)
  }

  const componentName = elementNameToComponentNameMapping[component.name]
  if (componentName) {
    return componentName
  }

  return component.name
}

export function compareCSSValues(
  attributeName: string,
  value1: string,
  value2: string,
): boolean {
  if (value1.includes('px') || value1.includes('rem')) {
    return areCSSPixelValuesEqual(value1, value2)
  }
  if ((colorTools as readonly string[]).includes(attributeName)) {
    return areHexColorsEqual(value1, value2)
  }

  return value1 === value2
}

export function areCSSPixelValuesEqual(value1: string, value2: string) {
  function normalizeCssValue(value: string) {
    if (typeof value === 'string') {
      if (value.endsWith('px')) {
        return parseFloat(value) // Convert px directly to a number
      } else if (value.endsWith('rem')) {
        return convertRemToPx(value) // Convert rem to px
      } else if (value === 'normal') {
        return 0
      }
    }
    return value
  }

  const normalizedValue1 = normalizeCssValue(value1)
  const normalizedValue2 = normalizeCssValue(value2)
  return normalizedValue1 === normalizedValue2
}

export const convertRemToPx = (rem: string) => {
  if (!rem.endsWith('rem')) {
    return parseFloat(rem)
  }

  const htmlRoot = document.documentElement
  const baseFontSize = parseFloat(
    window.getComputedStyle(htmlRoot).getPropertyValue('font-size'),
  )
  return parseFloat(rem) * baseFontSize
}
