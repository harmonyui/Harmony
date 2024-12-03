import type { HarmonyComponentInfo } from '@harmony/util/src/types/component'
import { getElementText } from '../../../utils/element-utils'
import type { ComponentElement } from '../../inspector/component-identifier'
import { isTextElement } from '../../inspector/inspector'
import { ComponentType } from './types'

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
