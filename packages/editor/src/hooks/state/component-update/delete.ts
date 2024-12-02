import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type { StateCreator } from 'zustand'
import { findElementFromId } from '../../../utils/element-utils'
import type { HarmonyCnState } from '../harmonycn'
import type { ComponentUpdateState } from './slice'

export const deleteComponentUpdate =
  ([set, get]: Parameters<
    StateCreator<ComponentUpdateState & HarmonyCnState>
  >) =>
  (update: ComponentUpdate, rootElement: HTMLElement | undefined) => {
    const component = findElementFromId(
      update.componentId,
      update.childIndex,
      rootElement,
    )
    if (!component)
      throw new Error(
        `makeUpdates: Cannot find from element with componentId ${update.componentId} and childIndex ${update.childIndex}`,
      )

    const createdElement = get().createdElements.find(
      (c) =>
        c.componentId === update.componentId &&
        c.childIndex === update.childIndex,
    )
    get().removeComponent(update.componentId, update.childIndex)

    component.remove()
    set((state) => {
      return {
        deletedElements: [
          ...state.deletedElements,
          createdElement ?? {
            componentId: update.componentId,
            childIndex: update.childIndex,
            element: component,
          },
        ],
      }
    })
  }
