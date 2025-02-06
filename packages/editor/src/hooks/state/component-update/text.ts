import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { replaceTextContentWithSpans } from '../../../utils/element-utils'

export const textComponentUpdate = (
  update: ComponentUpdate,
  element: HTMLElement,
) => {
  const index = parseInt(update.name)
  if (isNaN(index)) {
    throw new Error(`Invalid update text element ${update.name}`)
  }

  if (index > element.childNodes.length - 1) {
    element.appendChild(document.createTextNode(''))
  }
  const textNodes = Array.from(element.childNodes)

  if (textNodes.length === 0) {
    element.textContent = update.value
  } else if (textNodes[index]?.textContent !== update.value) {
    textNodes[index].textContent = update.value
  }

  if (index > 0) {
    replaceTextContentWithSpans(element)
  }
}
