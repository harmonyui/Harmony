import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type { AddComponent } from '@harmony/util/src/updates/component'
import type { StateCreator } from 'zustand'
import type { HarmonyCn } from '@harmony/util/src/harmonycn/types'
import { harmonyCnSchema } from '@harmony/util/src/harmonycn/types'
import type { HarmonyCnState } from '../harmonycn'
import type { CreatedComponent } from '../../../utils/harmonycn/types'
import { createComponentElement } from '../../../utils/harmonycn/create-component'
import {
  findElementFromId,
  recurseElements,
} from '../../../utils/element-utils'
import type { ComponentState } from '../component-state'
import type { ComponentUpdateState } from './slice'

export const createComponentUpdate = ([set, get]: Parameters<
  StateCreator<ComponentUpdateState & HarmonyCnState & ComponentState>
>) => {
  const getCreatedElement = (
    component: HarmonyCn | undefined,
    copiedFrom: AddComponent['copiedFrom'],
    componentId: string,
    childIndex: number,
    rootElement: HTMLElement | undefined,
  ): CreatedComponent => {
    const cachedElement = get().deletedElements.find(
      (c) => c.componentId === componentId && c.childIndex === childIndex,
    )
    if (cachedElement) {
      return cachedElement
    }

    if (copiedFrom) {
      const { componentId: copiedComponentId, childIndex: copiedChildIndex } =
        copiedFrom
      const copiedElement = findElementFromId(
        copiedComponentId,
        copiedChildIndex,
        rootElement,
      )

      if (!copiedElement) {
        throw new Error('Cannot find copied from element')
      }

      const clonedElement = copiedElement.cloneNode(true) as HTMLElement
      // Give each new element a new child index to not conflict with the copied element
      recurseElements(clonedElement, [
        (element) => {
          const harmonyId = element.dataset.harmonyId ?? ''
          element.dataset.harmonyChildIndex = String(
            get().getNewChildIndex(harmonyId),
          )
        },
      ])

      return {
        componentId,
        childIndex,
        element: clonedElement,
      }
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
    copiedFrom,
    rootElement,
  }: {
    component: string | undefined
    componentId: string
    childIndex: number
    parentElement: HTMLElement
    index: number
    copiedFrom: AddComponent['copiedFrom']
    rootElement: HTMLElement | undefined
  }) => {
    const simpleComponent = harmonyCnSchema.safeParse(component)
    if (simpleComponent.success || !component) {
      const element = getCreatedElement(
        simpleComponent.success ? simpleComponent.data : undefined,
        copiedFrom,
        componentId,
        childIndex,
        rootElement,
      )
      element.element.dataset.harmonyId = componentId
      element.element.dataset.harmonyChildIndex = String(childIndex)

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
    const { parentId, component, parentChildIndex, index, copiedFrom } = value

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
      copiedFrom,
      rootElement,
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
