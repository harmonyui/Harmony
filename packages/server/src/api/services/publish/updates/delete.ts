import { parseUpdate } from '@harmony/util/src/updates/utils'
import { deleteComponentSchema } from '@harmony/util/src/updates/component'
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { getLevelId } from '@harmony/util/src/utils/component'
import type { FlowGraph } from '../../indexor/graph'
import type { UpdateComponent } from './types'

export const deleteUpdate: UpdateComponent = ({ value, update }, graph) => {
  parseUpdate(deleteComponentSchema, value)

  return deleteComponent(update, graph)
}

export const deleteComponent = (update: ComponentUpdate, graph: FlowGraph) => {
  const numLevels = update.componentId.split('#').length
  for (let i = 0; i < numLevels; i++) {
    const componentId = getLevelId(update.componentId, i)
    const deleteElement = graph.getJSXElementById(
      componentId,
      update.childIndex,
    )
    if (!deleteElement) {
      throw new Error(
        `Element with id ${update.componentId} and ${update.childIndex} not found`,
      )
    }
    const parentComponent = deleteElement.getParentComponent()
    if (parentComponent.getJSXElements()[0].id === deleteElement.id) {
      continue
    }
    return graph.deleteElement(deleteElement)
  }

  throw new Error('Could not find element to delete')
}
