import { parseUpdate } from '@harmony/util/src/updates/utils'
import { reorderComponentSchema } from '@harmony/util/src/updates/component'
import { createComponent } from './create'
import { deleteComponent } from './delete'
import type { UpdateComponent } from './types'

export const reorderUpdate: UpdateComponent = (info, graph) => {
  const value = parseUpdate(reorderComponentSchema, info.value)
  const code = deleteComponent(info.update, graph)

  createComponent(
    info.update,
    value,
    { implementation: code, dependencies: [], name: '' },
    graph,
  )
}
