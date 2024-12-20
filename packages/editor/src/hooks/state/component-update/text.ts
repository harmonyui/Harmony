import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { replaceTextContentWithSpans } from '../../../utils/element-utils'

export const textComponentUpdate = (
  update: ComponentUpdate,
  element: HTMLElement,
) => {
  const textNodes = Array.from(element.childNodes)
  const index = parseInt(update.name)
  if (isNaN(index)) {
    throw new Error(`Invalid update text element ${update.name}`)
  }
  if (textNodes.length === 0) {
    element.textContent = update.value
    if (index > 0) {
      replaceTextContentWithSpans(element)
    }
  } else if (textNodes[index]?.textContent !== update.value) {
    textNodes[index].textContent = update.value
  }
}
