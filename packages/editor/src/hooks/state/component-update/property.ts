import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { parseUpdate } from '@harmony/util/src/updates/utils'
import { updatePropertySchema } from '@harmony/util/src/updates/property'

export const propertyUpdate = (
  update: ComponentUpdate,
  element: HTMLElement,
) => {
  const { valueMapping } = parseUpdate(updatePropertySchema, update.value)
  const { valueMapping: oldValueMapping } = parseUpdate(
    updatePropertySchema,
    update.oldValue,
  )
  //if (type === 'classNameVariant') {
  const classes = element.getAttribute('class') ?? ''
  const newValue = classes.replace(oldValueMapping, valueMapping)
  element.setAttribute('class', newValue)
}
