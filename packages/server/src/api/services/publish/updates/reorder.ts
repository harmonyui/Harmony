import { parseUpdate } from '@harmony/util/src/updates/utils'
import { reorderComponentSchema } from '@harmony/util/src/updates/component'
import { createComponent } from './create'
import { deleteComponent } from './delete'
import type { UpdateComponent } from './types'
import { FlowGraph } from '../../indexor/graph'

export const reorderUpdate: UpdateComponent = async (info, graph) => {
  const value = parseUpdate(reorderComponentSchema, info.value)
  reorderElement(value, info.update, graph)
}

export const reorderElement = (
  parentInfo: { parentId: string; parentChildIndex: number; index: number },
  componentInfo: { componentId: string; childIndex: number },
  graph: FlowGraph,
) => {
  const codeInfo = deleteComponent(componentInfo, graph)

  createComponent(
    { componentId: codeInfo.componentId, childIndex: componentInfo.childIndex },
    parentInfo,
    codeInfo,
    graph,
  )
}
