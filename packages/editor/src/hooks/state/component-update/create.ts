import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type { AddComponent } from '@harmony/util/src/updates/component'
import type { StateCreator } from 'zustand'
import type { HarmonyCn } from '@harmony/util/src/harmonycn/types'
import { harmonyCnSchema } from '@harmony/util/src/harmonycn/types'
import type { HarmonyCnState } from '../harmonycn'
import type { CreatedComponent } from '../../../utils/harmonycn/types'
import { createComponentElement } from '../../../utils/harmonycn/create-component'
import { findElementFromId } from '../../../utils/element-utils'
import type { ComponentUpdateState } from './slice'

export const createComponentUpdate = ([set, get]: Parameters<
  StateCreator<ComponentUpdateState & HarmonyCnState>
>) => {
  const getCreatedElement = (
    component: HarmonyCn | undefined,
    componentId: string,
    childIndex: number,
  ): CreatedComponent => {
    const cachedElement = get().deletedElements.find(
      (c) => c.componentId === componentId && c.childIndex === childIndex,
    )
    if (cachedElement) {
      return cachedElement
    }
    if (!component) {
      throw new Error(
        'New Component marked as cached but no cached element found',
      )
    }
    return createComponentElement(component, componentId, childIndex)
  }

  const mountComponent = async ({
    component,
    componentId,
    childIndex,
    parentElement,
    index,
  }: {
    component: string | undefined
    componentId: string
    childIndex: number
    parentElement: HTMLElement
    index: number
  }) => {
    const simpleComponent = harmonyCnSchema.safeParse(component)
    if (simpleComponent.success || !component) {
      const element = getCreatedElement(
        simpleComponent.success ? simpleComponent.data : undefined,
        componentId,
        childIndex,
      )

      const children = parentElement.children
      if (index < children.length) {
        parentElement.insertBefore(element.element, children[index])
      } else {
        parentElement.appendChild(element.element)
      }
      set((state) => ({ createdElements: [...state.createdElements, element] }))
    } else {
      const createdComponent = await get().mountComponent({
        componentId,
        childIndex,
        name: component,
        parentElement,
        index,
      })
      set((state) => ({
        createdElements: [...state.createdElements, createdComponent],
      }))
    }
  }

  return async (
    update: ComponentUpdate,
    value: AddComponent,
    rootElement: HTMLElement | undefined,
  ) => {
    const { parentId, component, parentChildIndex, index } = value

    const parent = findElementFromId(parentId, parentChildIndex, rootElement)

    if (!parent)
      throw new Error(
        `makeUpdates: Cannot find from element with componentId ${update.componentId} and childIndex ${update.childIndex}`,
      )
    await mountComponent({
      component,
      componentId: update.componentId,
      childIndex: update.childIndex,
      parentElement: parent,
      index,
    })
    set((state) => {
      return {
        deletedElements: state.deletedElements.filter(
          (c) =>
            c.componentId !== update.componentId &&
            c.childIndex !== update.childIndex,
        ),
      }
    })
  }
}
