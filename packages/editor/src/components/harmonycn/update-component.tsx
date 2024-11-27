import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type {
  AddComponent,
  DeleteComponent,
} from '@harmony/util/src/updates/component'
import type { ComponentUpdateWithoutGlobal } from '../harmony-context'
import { useHarmonyContext } from '../harmony-context'
import { getComponentIdAndChildIndex } from '../../utils/element-utils'
import { createUpdate } from '../../utils/update'

export const useUpdateComponent = () => {
  const { onAttributesChange } = useHarmonyContext()

  const addComponent = useCallback(
    (element: HTMLElement, component: string, position: 'above' | 'below') => {
      const parent = element.parentElement
      if (!parent) {
        throw new Error('Parent not found')
      }
      const { componentId, childIndex } = getComponentIdAndChildIndex(parent)

      const cacheId = uuidv4()

      let index = Array.from(parent.children).indexOf(element)
      if (position === 'below') {
        index += 1
      }

      const update: ComponentUpdateWithoutGlobal = {
        type: 'component',
        name: 'delete-create',
        componentId: cacheId,
        childIndex: 0,
        oldValue: createUpdate<DeleteComponent>({
          action: 'delete',
        }),
        value: createUpdate<AddComponent>({
          parentId: componentId,
          component,
          parentChildIndex: childIndex,
          index,
          action: 'create',
        }),
      }
      onAttributesChange([update])
    },
    [],
  )

  return { addComponent }
}
