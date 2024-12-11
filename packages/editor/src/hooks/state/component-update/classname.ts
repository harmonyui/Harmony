import type { Font } from '@harmony/util/src/fonts'
import type { ComponentUpdate } from '@harmony/util/src/types/component'

export const classNameComponentUpdate = (
  update: ComponentUpdate,
  htmlElement: HTMLElement,
  fonts: Font[] | undefined,
) => {
  if (update.name === 'font') {
    if (!fonts) {
      console.log('No fonts are installed')
      return
    }
    const font = fonts.find((f) => f.id === update.value)
    if (!font) throw new Error(`Invlaid font ${update.value}`)

    fonts.forEach((f) => {
      htmlElement.className = htmlElement.className.replace(f.id, '')
    })

    htmlElement.classList.add(font.font.className)
  } else if (update.name === 'class') {
    update.value.split(' ').forEach((value) => htmlElement.classList.add(value))
  } else {
    htmlElement.style[update.name as unknown as number] = update.value
  }
}
