import { useCallback } from 'react'
import type {
  AddComponent,
  DeleteComponent,
} from '@harmony/util/src/updates/component'
import { generateComponentIdFromParent } from '@harmony/util/src/utils/component'
import type { ComponentUpdateWithoutGlobal } from '../harmony-context'
import { useHarmonyContext } from '../harmony-context'
import { getComponentIdAndChildIndex } from '../../utils/element-utils'
import { createUpdate } from '../../utils/update'
import { useHarmonyStore } from '../../hooks/state'

export interface UpdateComponentOptions {
  position?: 'above' | 'below'
  parent?: HTMLElement
  copiedFrom?: {
    componentId: string
    childIndex: number
  }
}
export const useUpdateComponent = () => {
  const { onAttributesChange } = useHarmonyContext()
  const rootElement = useHarmonyStore((store) => store.rootComponent?.element)
  const getNewChildIndex = useHarmonyStore((store) => store.getNewChildIndex)

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
      const { componentId: parentId, childIndex: parentChildIndex } =
        getComponentIdAndChildIndex(parent)

      const componentId = generateComponentIdFromParent(parentId)

      const childIndex = getNewChildIndex(componentId)

      let index = options.position
        ? Array.from(parent.children).indexOf(element)
        : 0
      if (options.position === 'below') {
        index += 1
      }

      const update: ComponentUpdateWithoutGlobal = {
        type: 'component',
        name: 'delete-create',
        componentId,
        childIndex,
        oldValue: createUpdate<DeleteComponent>({
          action: 'delete',
        }),
        value: createUpdate<AddComponent>({
          parentId,
          component,
          copiedFrom: options.copiedFrom,
          parentChildIndex,
          index,
          action: 'create',
        }),
        dateModified: new Date(),
      }
      onAttributesChange([update])
    },
    [rootElement],
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
        cached: true,
        parentChildIndex,
        index,
        action: 'create',
      }),
      dateModified: new Date(),
    }
    onAttributesChange([update])
  }, [])

  return { addComponent, deleteComponent }
}
