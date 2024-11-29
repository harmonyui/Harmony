import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type { AddComponent } from '@harmony/util/src/updates/component'
import type { CreatedComponent } from '../harmonycn/types'
import type { ComponentUpdateState } from '../../hooks/state/component-update'
import { findElementFromId } from '../element-utils'
import { createComponentElement } from '../harmonycn/create-component'
import { updateCreatedElementOptions } from './utils'

export const createComponentUpdate = (
  update: ComponentUpdate,
  value: AddComponent,
  cachedElements: CreatedComponent[],
  rootElement: HTMLElement | undefined,
): ((
  state: Pick<ComponentUpdateState, 'cachedElements' | 'createdElements'>,
) => Pick<ComponentUpdateState, 'cachedElements' | 'createdElements'>) => {
  const { parentId, component, parentChildIndex, index } = value

  const getCreatedElement = (): CreatedComponent => {
    const cachedElement = cachedElements.find(
      (c) =>
        c.componentId === update.componentId &&
        c.childIndex === update.childIndex,
    )
    if (cachedElement) {
      return cachedElement
    }
    if (!component) {
      throw new Error("Element is marked as cached but doesn't exist")
    }
    return createComponentElement(
      component,
      update.componentId,
      update.childIndex,
    )
  }
  const createdElement = getCreatedElement()
  const parent = findElementFromId(parentId, parentChildIndex, rootElement)

  if (!parent)
    throw new Error(
      `makeUpdates: Cannot find from element with componentId ${update.componentId} and childIndex ${update.childIndex}`,
    )
  const child = Array.from(parent.childNodes).find((_, indx) => indx === index)
  if (!child) {
    parent.appendChild(createdElement.element)
  } else {
    parent.insertBefore(createdElement.element, child)
  }
  return (state) => {
    state.createdElements = [...state.createdElements, createdElement]

    // Update parent created element to remove isEmpty
    state.createdElements = updateCreatedElementOptions(
      state.createdElements,
      parentId,
      parentChildIndex,
      {
        isEmpty: false,
      },
    )

    if (child) {
      state.cachedElements = state.cachedElements.filter(
        (c) =>
          c.componentId !== update.componentId &&
          c.childIndex !== update.childIndex,
      )
    }

    return state
  }
}
