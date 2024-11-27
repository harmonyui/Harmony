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

export interface UpdateComponentOptions {
  position?: 'above' | 'below'
  parent?: HTMLElement
}
export const useUpdateComponent = () => {
  const { onAttributesChange } = useHarmonyContext()

  const addComponent = useCallback(
    (
      element: HTMLElement,
      component: string,
      options: UpdateComponentOptions,
    ) => {
      const parent = options.parent ?? element.parentElement
      if (!parent) {
        throw new Error('Parent not found')
      }
      const { componentId, childIndex } = getComponentIdAndChildIndex(parent)

      const cacheId = uuidv4()

      let index = options.position
        ? Array.from(parent.children).indexOf(element)
        : 0
      if (options.position === 'below') {
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

  const deleteComponent = useCallback((element: HTMLElement) => {
    const { componentId, childIndex } = getComponentIdAndChildIndex(element)
    const parent = element.parentElement
    if (!parent) {
      throw new Error('Parent not found')
    }
    const { componentId: parentId, childIndex: parentChildIndex } =
      getComponentIdAndChildIndex(parent)
    const index = Array.from(parent.children).indexOf(element)
    const update: ComponentUpdateWithoutGlobal = {
      type: 'component',
      name: 'delete-create',
      componentId,
      childIndex,
      value: createUpdate<DeleteComponent>({
        action: 'delete',
      }),
      oldValue: createUpdate<AddComponent>({
        parentId,
        component: 'component',
        parentChildIndex,
        index,
        action: 'create',
      }),
    }
    onAttributesChange([update])
  }, [])

  return { addComponent, deleteComponent }
}
