/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok*/
/* eslint-disable @typescript-eslint/prefer-for-of -- ok*/
import type { Font } from '@harmony/util/src/fonts'
import {
  camelToKebab,
  constArray,
  convertRgbToHex,
} from '@harmony/util/src/utils/common'
import type { HexColor } from '@harmony/util/src/types/colors'
import {
  getComputedValue,
  isDesignerElementSelectable,
} from '../../utils/element-utils'
import { attributeTools, colorTools } from './types'
import type {
  ColorTools,
  CommonTools,
  ComponentToolData,
  ToolAttributeValue,
} from './types'

export const getTextToolsFromAttributes = (
  element: HTMLElement,
  fonts: Font[] | undefined,
): ToolAttributeValue<CommonTools>[] => {
  const allStyles: [HTMLElement, Record<string, string>][] = []

  const getComputed = (name: keyof CSSStyleDeclaration) => {
    let selectedElement: HTMLElement | undefined = element
    let value: string | undefined

    function find(style: [HTMLElement, Record<string, string>]) {
      return style[0] === selectedElement
    }

    while (selectedElement && !value) {
      let styles = allStyles.find(find)
      if (!styles) {
        const newStyles: [HTMLElement, Record<string, string>] = [
          selectedElement,
          getAppliedComputedStyles(selectedElement),
        ]
        allStyles.push(newStyles)
        styles = newStyles
      }
      value = styles[1][camelToKebab(name as string)]
      if (value) {
        break
      }
      selectedElement = isDesignerElementSelectable(
        selectedElement.parentElement,
      )
        ? selectedElement.parentElement
        : undefined
    }
    if (!selectedElement) {
      value =
        allStyles.find((style) => style[0] === element)?.[1][name as string] ||
        getComputedValue(element, camelToKebab(name as string))
    }
    return { value: value!, element: selectedElement }
  }

  const getAttr = (
    name: keyof CSSStyleDeclaration,
  ): { value: string; element: HTMLElement | undefined } => {
    const computed = getComputed(name)

    if (name === 'font') {
      if (!fonts) {
        //console.log("No fonts");
        return { element, value: '' }
      }
      const font = fonts.find(
        (f) =>
          element.classList.contains(f.id) ||
          computed.value.toLowerCase().includes(f.name.toLowerCase()),
      )

      if (font) return { element, value: font.id }

      return computed
    }
    return computed
  }

  const getColor = (
    name: ColorTools,
  ): { value: HexColor; element: HTMLElement | undefined } => {
    const color = getAttr(name)

    return {
      value: convertRgbToHex(color.value),
      element: color.element,
    }
  }
  const all = constArray<ComponentToolData>()([
    ...attributeTools.map((prop) => ({ name: prop, ...getAttr(prop) })),
    ...colorTools.map((prop) => ({ name: prop, ...getColor(prop) })),
  ])

  return all
}

function getAppliedComputedStyles(
  element: HTMLElement,
  pseudo?: string | null,
) {
  const styles = window.getComputedStyle(element, pseudo)
  const styleMap = element.computedStyleMap()
  const inlineStyles = element.getAttribute('style')

  const retval: Record<string, string> = {}
  for (let i = 0; i < styles.length; i++) {
    const key = styles[i]
    const value = styles.getPropertyValue(key)

    element.style.setProperty(key, 'unset')

    const unsetValue = styles.getPropertyValue(key)

    if (inlineStyles) element.setAttribute('style', inlineStyles)
    else element.removeAttribute('style')

    if (unsetValue !== value) {
      const computedValue = styleMap.get(key)
      if (!computedValue)
        throw new Error(`Could not find computed vlaue ${key}`)
      retval[key] = computedValue.toString()
    }
  }

  return retval
}
