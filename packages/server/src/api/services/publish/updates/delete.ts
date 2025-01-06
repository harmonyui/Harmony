import { parseUpdate } from '@harmony/util/src/updates/utils'
import { deleteComponentSchema } from '@harmony/util/src/updates/component'
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type { FlowGraph } from '../../indexor/graph'
import type { InstanceInfo, UpdateComponent } from './types'
import { getJSXElementFromLevels } from './utils'

export const deleteUpdate: UpdateComponent = async (
  { value, update },
  graph,
) => {
  parseUpdate(deleteComponentSchema, value)

  deleteComponent(update, graph)
}

export const deleteComponent = (
  update: ComponentUpdate,
  graph: FlowGraph,
): InstanceInfo & { componentId: string } => {
  const deleteElement = getJSXElementFromLevels(
    update.componentId,
    update.childIndex,
    graph,
  )
  if (!deleteElement) {
    throw new Error('Could not find element to delete')
  }
  const childElements = deleteElement.getJSXChildren(true)
  const code = graph.deleteElement(deleteElement)

  return {
    componentIds: childElements.map((node) => node.id),
    implementation: code,
    dependencies: [],
    componentId: deleteElement.id,
  }
}
