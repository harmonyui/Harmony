import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { parseUpdate } from '@harmony/util/src/updates/utils'
import { reorderComponentSchema } from '@harmony/util/src/updates/component'
import type { CreatedComponent } from '../harmonycn/types'
import { createComponentUpdate } from './create'
import { deleteComponentUpdate } from './delete'

export const reorderComponentUpdate = (
  update: ComponentUpdate,
  cachedElements: CreatedComponent[],
  createdElements: CreatedComponent[],
  rootElement: HTMLElement | undefined,
): void => {
  const { parentId, parentChildIndex, index } = parseUpdate(
    reorderComponentSchema,
    update.value,
  )

  const state1 = deleteComponentUpdate(update, createdElements, rootElement)
  createComponentUpdate(
    update,
    {
      parentId,
      component: undefined,
      parentChildIndex,
      index,
      cached: true,
      action: 'create',
    },
    state1({ cachedElements, createdElements }).cachedElements,
    rootElement,
  )
}
