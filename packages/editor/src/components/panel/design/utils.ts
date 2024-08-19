import { isTextElement } from '../../inspector/inspector'
import { ComponentType } from './types'

export const getComponentType = (element: HTMLElement): ComponentType => {
  const tagName = element.tagName.toLowerCase()
  if (isTextElement(element)) {
    return ComponentType.Text
  }
  if (['svg', 'img'].includes(tagName)) {
    return ComponentType.Shape
  }

  return ComponentType.Frame
}
