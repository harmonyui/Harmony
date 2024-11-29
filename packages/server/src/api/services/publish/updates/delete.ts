import { parseUpdate } from '@harmony/util/src/updates/utils'
import { deleteComponentSchema } from '@harmony/util/src/updates/component'
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type { FlowGraph } from '../../indexor/graph'
import type { UpdateComponent } from './types'

export const deleteUpdate: UpdateComponent = ({ value, update }, graph) => {
  parseUpdate(deleteComponentSchema, value)

  return deleteComponent(update, graph)
}

export const deleteComponent = (update: ComponentUpdate, graph: FlowGraph) => {
  const deleteElement = graph.getJSXElementById(
    update.componentId,
    update.childIndex,
  )
  if (!deleteElement) {
    throw new Error(
      `Element with id ${update.componentId} and ${update.childIndex} not found`,
    )
  }
  return graph.deleteElement(deleteElement)
}
