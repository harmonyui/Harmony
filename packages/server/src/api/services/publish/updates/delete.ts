import { parseUpdate } from '@harmony/util/src/updates/utils'
import { deleteComponentSchema } from '@harmony/util/src/updates/component'
import type { UpdateComponent } from './types'

export const deleteUpdate: UpdateComponent = ({ value, update }, graph) => {
  parseUpdate(deleteComponentSchema, value)

  const deleteElement = graph.getJSXElementById(
    update.componentId,
    update.childIndex,
  )
  if (!deleteElement) {
    throw new Error(
      `Element with id ${update.componentId} and ${update.childIndex} not found`,
    )
  }
  graph.deleteElement(deleteElement)
}
