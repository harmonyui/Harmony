import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type { StateCreator } from 'zustand'
import type { HarmonyCnState } from '../harmonycn'
import { findElementFromId } from '../../../utils/element-utils'
import type { ComponentUpdateState } from './slice'

export const deleteComponentUpdate =
  ([set, get]: Parameters<
    StateCreator<ComponentUpdateState & HarmonyCnState>
  >) =>
  (update: ComponentUpdate, rootElement: HTMLElement | undefined) => {
    const createdElement = get().createdElements.find(
      (c) =>
        c.componentId === update.componentId &&
        c.childIndex === update.childIndex,
    )
    const element =
      createdElement?.element ??
      findElementFromId(update.componentId, update.childIndex, rootElement)
    if (!element) throw new Error("Can't find element to delete")

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
  }
