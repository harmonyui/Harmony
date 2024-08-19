/* eslint-disable @typescript-eslint/prefer-for-of -- ok*/

/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok*/
import {
  camelToKebab,
  constArray,
  convertRgbToHex,
} from '@harmony/util/src/utils/common'
import { createContext, useCallback, useContext, useMemo } from 'react'
import type { Font } from '@harmony/util/src/fonts'
import type { ComponentUpdateWithoutGlobal } from '../../harmony-context'
import { useHarmonyContext } from '../../harmony-context'
import { getComputedValue } from '../../snapping/position-updator'
import { isDesignerElementSelectable } from '../../inspector/inspector'
import type { ComponentElement } from '../../inspector/component-identifier'
import { useHarmonyStore } from '../../hooks/state'
import { getComponentIdAndChildIndex } from '../../../utils/element-utils'
import type { CommonTools, ComponentToolData } from './types'
import { attributeTools, colorTools } from './types'

interface ComponentAttributeContextProps {
  selectedComponent: HTMLElement | undefined
  onAttributeChange: (value: ComponentToolData) => void
  data: ReturnType<typeof getTextToolsFromAttributes> | undefined
  getAttribute: (value: CommonTools, isComputed?: boolean) => string
}
const ComponentAttributeContext = createContext<ComponentAttributeContextProps>(
  {
    selectedComponent: {} as HTMLElement,
    onAttributeChange: () => undefined,
    data: [],
    getAttribute: () => '',
  },
)
interface ComponentAttributeProviderProps {
  children: React.ReactNode
  onChange: (update: ComponentUpdateWithoutGlobal[]) => void
}
export const ComponentAttributeProvider: React.FunctionComponent<
  ComponentAttributeProviderProps
> = ({ children, onChange }) => {
  const { fonts } = useHarmonyContext()
  const selectedComponent = useHarmonyStore((state) => state.selectedComponent)
  const updateCounter = useHarmonyStore((state) => state.updateCounter)
  const data = useMemo(
    () =>
      selectedComponent
        ? getTextToolsFromAttributes(selectedComponent, fonts)
        : undefined,
    [selectedComponent, fonts, updateCounter],
  )

  const onAttributeChange = (values: ComponentToolData) => {
    if (!data || !selectedComponent) return

    const old = data.find((t) => t.name === values.name)
    if (!old) throw new Error('Cannot find old property')
    const oldValue = old.value
    const { componentId, childIndex } = getComponentIdAndChildIndex(old.element)

    const update: ComponentUpdateWithoutGlobal = {
      componentId,
      type: 'className',
      name: values.name,
      value: values.value,
      oldValue,
      childIndex,
    }

    onChange([update])
  }

  const selectedElement = selectedComponent?.element

  const getAttribute = useCallback(
    (attribute: CommonTools, isComputed = false): string => {
      if (isComputed && selectedElement) {
        return getComputedValue(selectedElement, camelToKebab(attribute))
      }
      if (data) {
        const value = data.find((d) => d.name === attribute)
        if (value) {
          return value.value
        }
      }

      return ''
    },
    [data, selectedElement],
  )

  return (
    <ComponentAttributeContext.Provider
      value={{
        selectedComponent: selectedComponent?.element,
        onAttributeChange,
        data,
        getAttribute,
      }}
    >
      {children}
    </ComponentAttributeContext.Provider>
  )
}

export const getTextToolsFromAttributes = (
  element: ComponentElement,
  fonts: Font[] | undefined,
) => {
  const allStyles: [HTMLElement, Record<string, string>][] = []

  const getComputed = (name: keyof CSSStyleDeclaration) => {
    let selectedElement: HTMLElement | undefined = element.element
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
      selectedElement = element.element!
      value =
        allStyles.find((style) => style[0] === element.element)?.[1][
          name as string
        ] || getComputedValue(element.element, camelToKebab(name as string))
    }
    return { value: value!, element: selectedElement }
  }

  const getAttr = (
    name: keyof CSSStyleDeclaration,
  ): { value: string; element: HTMLElement } => {
    const computed = getComputed(name)

    if (name === 'font') {
      if (!fonts) {
        //console.log("No fonts");
        return { element: element.element, value: '' }
      }
      const font = fonts.find(
        (f) =>
          element.element.classList.contains(f.id) ||
          computed.value.toLowerCase().includes(f.name.toLowerCase()),
      )

      if (font) return { element: element.element, value: font.id }

      return computed
    }
    return computed
  }

  const getColor = (name: 'color' | 'backgroundColor' | 'borderColor') => {
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
  const inlineStyles = element.getAttribute('style')

  const retval: Record<string, string> = {}
  for (let i = 0; i < styles.length; i++) {
    const key = styles[i]
    const value = styles.getPropertyValue(key)

    element.style.setProperty(key, 'unset')

    const unsetValue = styles.getPropertyValue(key)

    if (inlineStyles) element.setAttribute('style', inlineStyles)
    else element.removeAttribute('style')

    if (unsetValue !== value) retval[key] = value
  }

  return retval
}

export const useComponentAttribute = () => {
  return useContext(ComponentAttributeContext)
}
