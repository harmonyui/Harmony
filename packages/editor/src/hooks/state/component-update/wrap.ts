import { ComponentUpdate } from '@harmony/util/src/types/component'
import {
  wrapComponentSchema,
  wrapUnwrapComponentSchema,
} from '@harmony/util/src/updates/component'
import { parseUpdate } from '@harmony/util/src/updates/utils'
import { ComponentState } from 'react'
import { StateCreator } from 'zustand'
import { HarmonyCnState } from '../harmonycn'
import { ComponentUpdateState } from './slice'
import { createComponentUpdate } from './create'
import {
  findElementFromId,
  getComponentIdAndChildIndex,
} from '../../../utils/element-utils'
import { deleteComponentUpdate } from './delete'

export const wrapComponentUpdate =
  (
    props: Parameters<
      StateCreator<ComponentUpdateState & HarmonyCnState & ComponentState>
    >,
  ) =>
  async (
    update: ComponentUpdate,
    rootElement: HTMLElement | undefined,
  ): Promise<boolean> => {
    const { value, componentId, childIndex } = update
    const { action } = parseUpdate(wrapUnwrapComponentSchema, value)
    if (action === 'wrap') {
      const { elements } = parseUpdate(wrapComponentSchema, value)
      if (elements.length === 0) return true

      const elementsMap = elements.map(({ componentId, childIndex }) =>
        findElementFromId(componentId, childIndex, rootElement),
      )
      const allElements = elementsMap.filter((el) => el !== undefined)
      if (elementsMap.length !== allElements.length) {
        return false
      }

      if (allElements[0].parentElement === null) {
        return false
      }

      const { componentId: parentId, childIndex: parentChildIndex } =
        getComponentIdAndChildIndex(allElements[0].parentElement)
      const index = Array.from(allElements[0].parentElement.children).indexOf(
        allElements[0],
      )

      const addComponent = createComponentUpdate(props)
      const result = await addComponent(
        update,
        {
          action: 'create',
          parentId,
          parentChildIndex,
          index,
          element: '<div></div>',
        },
        rootElement,
      )
      if (!result) {
        return false
      }
      const createdElement = findElementFromId(
        componentId,
        childIndex,
        rootElement,
      )
      if (!createdElement) {
        return false
      }

      allElements.forEach((el) => {
        createdElement.appendChild(el)
      })
    } else if (action === 'unwrap') {
      const unwrapElement = findElementFromId(
        componentId,
        childIndex,
        rootElement,
      )
      if (!unwrapElement) {
        return false
      }
      Array.from(unwrapElement.children).forEach((el) => {
        unwrapElement.insertAdjacentElement('beforebegin', el)
      })

      return deleteComponentUpdate(props)(update, rootElement)
    }

    return true
  }
