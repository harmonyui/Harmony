/* eslint-disable no-await-in-loop  -- ok*/
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type { Font } from '@harmony/util/src/fonts'
import {
  addComponentSchema,
  addDeleteComponentSchema,
  updateAttributeValue,
} from '@harmony/util/src/updates/component'
import { parseUpdate } from '@harmony/util/src/updates/utils'
import {
  findElementFromId,
  findSameElementsFromId,
} from '../../../utils/element-utils'
import type { CreatedComponent } from '../../../utils/harmonycn/types'
import { createHarmonySlice } from '../factory'
import type { HarmonyCnState } from '../harmonycn'
import type { ComponentState } from '../component-state'
import { deleteComponentUpdate } from './delete'
import { createComponentUpdate } from './create'
import { reorderComponentUpdate } from './reorder'
import { propertyUpdate } from './property'
import { classNameComponentUpdate } from './classname'
import { styleComponentUpdate } from './style'
import { textComponentUpdate } from './text'

export interface ComponentUpdateState {
  componentUpdates: ComponentUpdate[]
  addComponentUpdates: (values: ComponentUpdate[]) => void
  makeUpdates: (
    updates: ComponentUpdate[],
    fonts: Font[] | undefined,
    rootElement: HTMLElement | undefined,
  ) => Promise<ComponentUpdate[]>
  deletedElements: CreatedComponent[]
  createdElements: CreatedComponent[]
}

export const createComponentUpdateSlice = createHarmonySlice<
  ComponentUpdateState,
  HarmonyCnState & ComponentState
>((set, get, api) => ({
  deletedElements: [],
  componentUpdates: [],
  createdElements: [],
  addComponentUpdates(value) {
    set((state) => {
      const copy = state.componentUpdates.slice()
      copy.push(...value)
      return {
        componentUpdates: copy,
      }
    })
  },
  async makeUpdates(
    updates: ComponentUpdate[],
    fonts: Font[] | undefined,
    rootElement: HTMLElement | undefined,
  ) {
    const appliedUpdates: ComponentUpdate[] = []

    const deleteComponent = deleteComponentUpdate([set, get, api])
    const createComponent = createComponentUpdate([set, get, api])
    const reorderComponent = reorderComponentUpdate([set, get, api])
    //Updates that should happen just for the element (reordering)
    for (const update of updates) {
      const element = findElementFromId(
        update.componentId,
        update.childIndex,
        rootElement,
      )

      if (update.type === 'component') {
        if (update.name === 'reorder') {
          if (!(await reorderComponent(update, rootElement))) {
            continue
          }
        }
        if (update.name === 'delete-create') {
          const result = parseUpdate(addDeleteComponentSchema, update.value)
          if (result.action === 'delete') {
            if (!deleteComponent(update, rootElement)) {
              continue
            }
          } else if (
            !(await createComponent(
              update,
              parseUpdate(addComponentSchema, update.value),
              rootElement,
            ))
          ) {
            continue
          }
        }
        if (update.name === 'style') {
          if (!element) continue
          await styleComponentUpdate([set, get, api])(
            update,
            element,
            rootElement,
          )
        }

        const _getElementsBetween = (
          start: Element,
          end: Element,
        ): Element[] => {
          const elements: Element[] = []
          elements.push(start)
          elements.push(end)
          let next = start.nextElementSibling

          while (next && next !== end) {
            elements.push(next)
            next = next.nextElementSibling
          }

          return elements
        }

        if (update.name === 'wrap-unwrap') {
          //const { value } = update
          // const { id, start, end, action } = JSON.parse(value) as {
          //   id: string
          //   action: string
          //   start: { id: string; childIndex: number }
          //   end: { id: string; childIndex: number }
          // }
          // if (action === 'wrap') {
          //   const cachedElement = get().cachedElements.find(
          //     (c) => c.id === id,
          //   )
          //   if (cachedElement) {
          //     const parent = cachedElement.parent
          //     parent.childNodes.forEach((child, index) => {
          //       if (index === start.childIndex) {
          //         parent.insertBefore(cachedElement.element, child)
          //         set((state) => {
          //           state.cachedElements = state.cachedElements.filter(
          //             (c) => c.id !== id,
          //           )
          //           return state
          //         })
          //         cachedElement.children!.forEach((c) => {
          //           c.remove()
          //         })
          //       }
          //     })
          //   } else {
          //     const startElement = findElementFromId(
          //       start.id,
          //       start.childIndex,
          //       rootElement,
          //     )
          //     const parent = startElement?.parentElement
          //     const endElement = findElementFromId(
          //       end.id,
          //       end.childIndex,
          //       rootElement,
          //     )
          //     if (!startElement || !endElement)
          //       throw new Error(
          //         `makeUpdates: Cannot find from element with componentId ${update.componentId} and childIndex ${update.childIndex}`,
          //       )
          //     const newComponent = document.createElement('div')
          //     newComponent.dataset.harmonyId = update.componentId
          //     newComponent.classList.add('hw-bg-primary-light')
          //     newComponent.classList.add('hw-p-[24px]')
          //     parent?.appendChild(newComponent)
          //     const elements = getElementsBetween(startElement, endElement)
          //     elements.forEach((element) => {
          //       element.remove()
          //       newComponent.appendChild(element)
          //     })
          //   }
          // } else if (action === 'unwrap') {
          //   const element = document.querySelector(
          //     `[data-harmony-id="${update.componentId}"]`,
          //   )
          //   const parent = element?.parentElement
          //   set((state) => {
          //     state.cachedElements.push({
          //       id,
          //       element: element?.cloneNode(true) as HTMLElement,
          //       parent: parent!,
          //       children: Array.from(element?.children || []),
          //     })
          //     return state
          //   })
          //   if (!element)
          //     throw new Error(
          //       `makeUpdates: Cannot find from element with componentId ${update.componentId} and childIndex ${update.childIndex}`,
          //     )
          //   const children = Array.from(element.children)
          //   children.forEach((child) => {
          //     parent?.appendChild(child)
          //   })
          //   element.remove()
          // }
        }
        if (update.name === 'replace-element') {
          const { value } = update
          const { value: actionValue, type } = JSON.parse(value) as {
            value: string
            type: 'text' | 'image' | 'svg'
          }
          if (!element) continue

          if (actionValue === '') {
            element.innerHTML = ''
          } else if (type === 'text') {
            const textNode = document.createElement('span')
            textNode.textContent = actionValue
            textNode.dataset.harmonyText = 'true'
            element.appendChild(textNode)
          } else if (type === 'image') {
            if (element instanceof HTMLImageElement) {
              element.src = actionValue
            } else {
              const img = document.createElement('img')
              img.src = actionValue
              img.dataset.harmonyId = update.componentId
              img.className = ''
              img.style.width = '100px'
              img.style.height = '100px'
              element.replaceWith(img)
            }
          } else {
            element.outerHTML = actionValue
            element.dataset.harmonyId = update.componentId
          }
        }

        if (update.name === 'update-attribute') {
          if (!element) continue
          const { value } = update
          const {
            action,
            name,
            value: newValue,
          } = parseUpdate(updateAttributeValue, value)
          if (action === 'delete') {
            element.removeAttribute(name)
          } else if (action === 'create') {
            element.setAttribute(name, newValue)
          } else {
            element.setAttribute(name, newValue)
          }
        }
      } else if (update.type === 'property') {
        const el = findElementFromId(
          update.componentId,
          update.childIndex,
          rootElement,
        )
        if (!el) continue

        propertyUpdate(update, el)
        //}
      } else if (update.type === 'text') {
        //If the element does not exist, it probably has not been mounted yet (like a modal)
        if (!element) continue
        textComponentUpdate(update, element)
      }

      appliedUpdates.push(update)
    }

    //Updates that should happen for every element in a component
    for (const update of updates) {
      const id = update.componentId
      const componentId = id.split('#')[id.split('#').length - 1]
      const sameElements = update.isGlobal
        ? findSameElementsFromId(componentId, rootElement)
        : [findElementFromId(id, update.childIndex, rootElement)]
      for (const element of Array.from(
        sameElements.filter((e) => e !== undefined),
      )) {
        const htmlElement = element

        if (update.type === 'className') {
          classNameComponentUpdate(update, htmlElement, fonts)
          appliedUpdates.push(update)
        }
      }
    }

    return appliedUpdates
  },
}))
