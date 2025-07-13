import { parseUpdate } from '@harmony/util/src/updates/utils'
import { deleteComponentSchema } from '@harmony/util/src/updates/component'
import type { FlowGraph } from '../../indexor/graph'
import type { InstanceInfo, UpdateComponent } from './types'
import { getJSXElementFromLevels } from '../../indexor/jsx-levels'

export const deleteUpdate: UpdateComponent = async (
  { value, update },
  graph,
) => {
  parseUpdate(deleteComponentSchema, value)

  deleteComponent(update, graph)
}

export const deleteComponent = (
  { componentId, childIndex }: { componentId: string; childIndex: number },
  graph: FlowGraph,
): InstanceInfo & { componentId: string } => {
  const deleteElement = getJSXElementFromLevels(componentId, childIndex, graph)
  if (!deleteElement) {
    throw new Error('Could not find element to delete')
  }
  const { content: code, childElements } = graph.deleteElement(deleteElement)

  return {
    componentIds: childElements.map((node) => node.id),
    implementation: code,
    dependencies: [],
    componentId: deleteElement.id,
  }
}
