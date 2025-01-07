import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type { StateCreator } from 'zustand'
import type { HarmonyCnState } from '../harmonycn'
import { findElementFromId } from '../../../utils/element-utils'
import type { ComponentUpdateState } from './slice'

export const deleteComponentUpdate =
  ([set, get]: Parameters<
    StateCreator<ComponentUpdateState & HarmonyCnState>
  >) =>
  (update: ComponentUpdate, rootElement: HTMLElement | undefined): boolean => {
    const createdElement = get().createdElements.find(
      (c) =>
        c.componentId === update.componentId &&
        c.childIndex === update.childIndex,
    )
    const element =
      createdElement?.element ??
      findElementFromId(update.componentId, update.childIndex, rootElement)

    //If the element does not exist, it probably has not been mounted yet (like a modal)
    if (!element) return false

    get().removeComponent(update.componentId, update.childIndex)

    element.remove()
    set((state) => {
      return {
        deletedElements: [
          ...state.deletedElements,
          createdElement ?? {
            componentId: update.componentId,
            childIndex: update.childIndex,
            element,
          },
        ],
        createdElements: createdElement
          ? state.createdElements.filter(
              (c) =>
                c.componentId !== createdElement.componentId ||
                c.childIndex !== createdElement.childIndex,
            )
          : state.createdElements,
      }
    })

    return true
  }
