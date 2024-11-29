import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type { Font } from '@harmony/util/src/fonts'
import {
  addDeleteComponentSchema,
  updateAttributeValue,
} from '@harmony/util/src/updates/component'
import { parseUpdate } from '@harmony/util/src/updates/utils'
import {
  findElementFromId,
  findSameElementsFromId,
  getComponentIdAndChildIndex,
} from '../../utils/element-utils'
import { createComponentElement } from '../../utils/harmonycn/create-component'
import type { CreatedComponent } from '../../utils/harmonycn/types'
import { createHarmonySlice } from './factory'

export interface ComponentUpdateState {
  componentUpdates: ComponentUpdate[]
  addComponentUpdates: (values: ComponentUpdate[]) => void
  makeUpdates: (
    updates: ComponentUpdate[],
    fonts: Font[] | undefined,
    rootElement: HTMLElement | undefined,
  ) => void
  cachedElements: CreatedComponent[]
  createdElements: CreatedComponent[]
}

export const createComponentUpdateSlice =
  createHarmonySlice<ComponentUpdateState>((set, get) => ({
    cachedElements: [],
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
    makeUpdates(
      updates: ComponentUpdate[],
      fonts: Font[] | undefined,
      rootElement: HTMLElement | undefined,
    ) {
      //Updates that should happen just for the element (reordering)
      for (const update of updates) {
        if (update.type === 'component') {
          if (update.name === 'reorder') {
            const { oldValue, value } = update
            const { parentId: oldParent, childIndex: oldChildIndex } =
              JSON.parse(oldValue) as { parentId: string; childIndex: number }
            const { parentId: newParent, childIndex: newChildIndex } =
              JSON.parse(value) as { parentId: string; childIndex: number }
            const error = `makeUpdates: Invalid reorder update componentId: ${update.componentId} oldParent: ${oldParent} newParent: ${newParent} oldChildIndex: ${oldChildIndex} newChildIndex: ${newChildIndex}`

            const validateId = (id: string) => {
              return id.trim().length > 0
            }

            if (
              !validateId(update.componentId) ||
              !validateId(oldParent) ||
              !validateId(newParent)
            ) {
              throw new Error(error)
            }

            const oldElement = findElementFromId(
              update.componentId,
              oldChildIndex,
              rootElement,
            )

            // Verify that we could find the old element to be deleted from the DOM
            if (!oldElement) {
              throw new Error(
                `makeUpdates: Cannot find from element with componentId ${update.componentId} and childIndex ${oldChildIndex}`,
              )
            }

            // Add element to new parent
            const newElement = document.querySelector(
              `[data-harmony-id="${newParent}"]`,
            )
            if (newElement) {
              const children = Array.from(newElement.children)
              if (newChildIndex >= 0 && newChildIndex < children.length) {
                newElement.insertBefore(oldElement, children[newChildIndex])
              } else {
                newElement.appendChild(oldElement)
              }
            } else {
              throw new Error(
                `makeUpdates: Cannot find the elements parent with data-harmony-id: ${newParent}`,
              )
            }
          }
          if (update.name === 'delete-create') {
            const { value } = update
            const result = parseUpdate(addDeleteComponentSchema, value)
            const updateCreatedElementOptions = (
              createdElements: CreatedComponent[],
              componentId: string,
              childIndex: number,
              options: Required<CreatedComponent['options']>,
            ) => {
              const createdElementIndex = createdElements.findIndex(
                (el) =>
                  el.componentId === componentId &&
                  el.childIndex === childIndex,
              )
              if (createdElementIndex > -1) {
                const createdElement = createdElements[createdElementIndex]
                createdElements[createdElementIndex] = {
                  ...createdElement,
                  options: createdElement.options
                    ? {
                        ...createdElement.options,
                        ...options,
                      }
                    : undefined,
                }
              }

              return createdElements
            }
            if (result.action === 'delete') {
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
              const {
                componentId: parentComponentId,
                childIndex: parentChildIndex,
              } = getComponentIdAndChildIndex(parent)

              component.remove()
              set((state) => {
                const createdElement = get().createdElements.find(
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
              })
            }
            if (result.action === 'create') {
              const { parentId, component, parentChildIndex, index } = result

              const getCreatedElement = (): CreatedComponent => {
                const cachedElement = get().cachedElements.find(
                  (c) =>
                    c.componentId === update.componentId &&
                    c.childIndex === update.childIndex,
                )
                if (cachedElement) {
                  return cachedElement
                }
                if (!component) {
                  throw new Error(
                    "Element is marked as cached but doesn't exist",
                  )
                }
                return createComponentElement(
                  component,
                  update.componentId,
                  update.childIndex,
                )
              }
              const createdElement = getCreatedElement()
              const parent = findElementFromId(
                parentId,
                parentChildIndex,
                rootElement,
              )

              if (!parent)
                throw new Error(
                  `makeUpdates: Cannot find from element with componentId ${update.componentId} and childIndex ${update.childIndex}`,
                )
              let inserted = false as boolean
              parent.childNodes.forEach((child, idx) => {
                if (idx === index) {
                  parent.insertBefore(createdElement.element, child)
                  inserted = true
                  set((state) => {
                    state.cachedElements = state.cachedElements.filter(
                      (c) =>
                        c.componentId !== update.componentId &&
                        c.childIndex !== update.childIndex,
                    )
                    return state
                  })
                }
              })
              if (!inserted) {
                parent.appendChild(createdElement.element)
              }
              set((state) => {
                state.createdElements = [
                  ...state.createdElements,
                  createdElement,
                ]

                // Update parent created element to remove isEmpty
                state.createdElements = updateCreatedElementOptions(
                  state.createdElements,
                  parentId,
                  parentChildIndex,
                  {
                    isEmpty: false,
                  },
                )

                return state
              })
            }
          }

          const getElementsBetween = (
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
            const { value } = update
            const { id, start, end, action } = JSON.parse(value) as {
              id: string
              action: string
              start: { id: string; childIndex: number }
              end: { id: string; childIndex: number }
            }
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
            const element = findElementFromId(
              update.componentId,
              update.childIndex,
              rootElement,
            )
            if (!element)
              throw new Error(
                `makeUpdates: Cannot find from element with componentId ${update.componentId} and childIndex ${update.childIndex}`,
              )
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
            const { value } = update
            const {
              action,
              name,
              value: newValue,
            } = parseUpdate(updateAttributeValue, value)
            const element = findElementFromId(
              update.componentId,
              update.childIndex,
              rootElement,
            )
            if (!element)
              throw new Error(
                `makeUpdates: Cannot find from element with componentId ${update.componentId} and childIndex ${update.childIndex}`,
              )
            if (action === 'delete') {
              element.removeAttribute(name)
            } else if (action === 'create') {
              element.setAttribute(name, newValue)
            } else {
              element.setAttribute(name, newValue)
            }
          }
        }

        //TODO: Need to figure out when a text component should update everywhere and where it should update just this element
        if (update.type === 'text') {
          const el = findElementFromId(
            update.componentId,
            update.childIndex,
            rootElement,
          )
          if (!el) continue //throw new Error(`Cannot find element with id ${update.componentId}`)

          const textNodes = Array.from(el.childNodes)
          const index = parseInt(update.name)
          if (isNaN(index)) {
            throw new Error(`Invalid update text element ${update.name}`)
          }
          if (textNodes[index]?.textContent !== update.value) {
            textNodes[index].textContent = update.value
          }
        }
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
            if (update.name === 'font') {
              if (!fonts) {
                console.log('No fonts are installed')
                continue
              }
              const font = fonts.find((f) => f.id === update.value)
              if (!font) throw new Error(`Invlaid font ${update.value}`)

              fonts.forEach((f) => {
                htmlElement.className = htmlElement.className.replace(f.id, '')
              })

              htmlElement.classList.add(font.font.className)
            } else {
              htmlElement.style[update.name as unknown as number] = update.value
            }
          }
        }
      }
    },
  }))
