import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type { CreatedComponent } from '../harmonycn/types'
import {
  findElementFromId,
  getComponentIdAndChildIndex,
} from '../element-utils'
import type { ComponentUpdateState } from '../../hooks/state/component-update'
import { updateCreatedElementOptions } from './utils'

export const deleteComponentUpdate = (
  update: ComponentUpdate,
  createdElements: CreatedComponent[],
  rootElement: HTMLElement | undefined,
): ((
  state: Pick<ComponentUpdateState, 'cachedElements' | 'createdElements'>,
) => Pick<ComponentUpdateState, 'cachedElements' | 'createdElements'>) => {
  const component = findElementFromId(
    update.componentId,
    update.childIndex,
    rootElement,
  )
  if (!component)
    throw new Error(
      `makeUpdates: Cannot find from element with componentId ${update.componentId} and childIndex ${update.childIndex}`,
    )
  const parent = component.parentElement
  if (!parent) {
    throw new Error('Parent not found')
  }
  const { componentId: parentComponentId, childIndex: parentChildIndex } =
    getComponentIdAndChildIndex(parent)

  component.remove()
  return (state) => {
    const createdElement = createdElements.find(
      (el) =>
        el.componentId === update.componentId &&
        el.childIndex === update.childIndex,
    )

    //If deleting this element makes the parent empty, then update that option
    if (!parent.hasChildNodes()) {
      state.createdElements = updateCreatedElementOptions(
        [...state.createdElements],
        parentComponentId,
        parentChildIndex,
        {
          isEmpty: true,
        },
      )
    }
    return {
      ...state,
      cachedElements: [
        ...state.cachedElements,
        createdElement ?? {
          componentId: update.componentId,
          childIndex: update.childIndex,
          element: component,
        },
      ],
    }
  }
}
