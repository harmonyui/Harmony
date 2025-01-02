import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { parseUpdate } from '@harmony/util/src/updates/utils'
import { reorderComponentSchema } from '@harmony/util/src/updates/component'
import type { StateCreator } from 'zustand'
import type { HarmonyCnState } from '../harmonycn'
import type { ComponentState } from '../component-state'
import { createComponentUpdate } from './create'
import { deleteComponentUpdate } from './delete'
import type { ComponentUpdateState } from './slice'

export const reorderComponentUpdate =
  (
    props: Parameters<
      StateCreator<ComponentUpdateState & HarmonyCnState & ComponentState>
    >,
  ) =>
  async (
    update: ComponentUpdate,
    rootElement: HTMLElement | undefined,
  ): Promise<boolean> => {
    const { parentId, parentChildIndex, index } = parseUpdate(
      reorderComponentSchema,
      update.value,
    )

    if (!deleteComponentUpdate(props)(update, rootElement)) {
      return false
    }
    return createComponentUpdate(props)(
      update,
      {
        parentId,
        component: undefined,
        parentChildIndex,
        index,
        cached: true,
        action: 'create',
      },
      rootElement,
    )
  }
