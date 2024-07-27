/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok*/
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type { Font } from '@harmony/util/src/fonts'
import {
  findElementFromId,
  findElementsFromId,
  findSameElementsFromId,
} from '../../../utils/element-utils'
import { createHarmonySlice } from './factory'

export interface CachedElement {
  id: string
  element: Element
  parent: HTMLElement
  children?: Element[]
}

export interface ComponentUpdateState {
  componentUpdates: ComponentUpdate[]
  addComponentUpdates: (values: ComponentUpdate[]) => void
  makeUpdates: (
    updates: ComponentUpdate[],
    fonts: Font[] | undefined,
    rootElement: HTMLElement | undefined,
  ) => void
  cachedElements: CachedElement[]
}

export const createComponentUpdateSlice =
  createHarmonySlice<ComponentUpdateState>((set, get) => ({
    cachedElements: [],
    componentUpdates: [],
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
      //TODO: This is kind of a hacky way to deal with the layering issue when we have a map of components
      //When we want global in this scenario, we are going to assume it is the next layer up (which is what isGlobal false does)
      //This might not hold true in all scenarios, but we will assume for now
      const translated = updates.map((orig) => {
        const update = { ...orig }
        const id = update.componentId
        const sameElements = findElementsFromId(id, rootElement)
        if (sameElements.length > 1) {
          update.childIndex = -1
        }

        return update
      })

      //Updates that should happen just for the element (reordering)
      for (const update of translated) {
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

            oldElement.remove()

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
            const { id, index, action } = JSON.parse(value) as {
              id: string
              index: number
              action: string
            }
            if (action === 'delete') {
              const component = findElementFromId(
                update.componentId,
                index,
                rootElement,
              )
              if (!component) {
                const undoComponent = findElementFromId(id, index, rootElement)
                if (undoComponent) {
                  undoComponent.remove()
                  return
                }
                throw new Error(
                  `makeUpdates: Cannot find the component with data-harmony-id: ${id}`,
                )
              }
              set((state) => {
                state.cachedElements.push({
                  id,
                  element: component.cloneNode(true) as Element,
                  parent: component.parentElement!,
                })
                return state
              })
              component.remove()
            }
            if (action === 'create') {
              const cachedElement = get().cachedElements.find(
                (c) => c.id === id,
              )
              if (cachedElement) {
                const parent = cachedElement.parent
                let inserted = false as boolean
                parent.childNodes.forEach((child, idx) => {
                  if (idx === index) {
                    parent.insertBefore(cachedElement.element, child)
                    inserted = true
                    set((state) => {
                      state.cachedElements = state.cachedElements.filter(
                        (c) => c.id !== id,
                      )
                      return state
                    })
                  }
                })
                if (!inserted) {
                  parent.appendChild(cachedElement.element)
                }
              } else {
                const { value: _value } = update
                const {
                  id: _id,
                  index: _index,
                  position,
                } = JSON.parse(_value) as {
                  id: string
                  index: number
                  position: string
                }
                const component = findElementFromId(
                  update.componentId,
                  _index,
                  rootElement,
                )
                if (!component)
                  throw new Error(
                    `makeUpdates: Cannot find from element with componentId ${update.componentId} and childIndex ${update.childIndex}`,
                  )
                const newComponent = document.createElement('div')
                newComponent.classList.add('hw-bg-primary-light')
                newComponent.classList.add('hw-w-full')
                newComponent.classList.add('hw-p-[24px]')
                newComponent.dataset.harmonyId = _id
                if (position === 'below') {
                  component.after(newComponent)
                } else {
                  component.before(newComponent)
                }
              }
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
            if (action === 'wrap') {
              const cachedElement = get().cachedElements.find(
                (c) => c.id === id,
              )
              if (cachedElement) {
                const parent = cachedElement.parent
                parent.childNodes.forEach((child, index) => {
                  if (index === start.childIndex) {
                    parent.insertBefore(cachedElement.element, child)
                    set((state) => {
                      state.cachedElements = state.cachedElements.filter(
                        (c) => c.id !== id,
                      )
                      return state
                    })
                    cachedElement.children!.forEach((c) => {
                      c.remove()
                    })
                  }
                })
              } else {
                const startElement = findElementFromId(
                  start.id,
                  start.childIndex,
                  rootElement,
                )
                const parent = startElement?.parentElement
                const endElement = findElementFromId(
                  end.id,
                  end.childIndex,
                  rootElement,
                )
                if (!startElement || !endElement)
                  throw new Error(
                    `makeUpdates: Cannot find from element with componentId ${update.componentId} and childIndex ${update.childIndex}`,
                  )

                const newComponent = document.createElement('div')
                newComponent.dataset.harmonyId = update.componentId
                newComponent.classList.add('hw-bg-primary-light')
                newComponent.classList.add('hw-p-[24px]')
                parent?.appendChild(newComponent)

                const elements = getElementsBetween(startElement, endElement)
                elements.forEach((element) => {
                  element.remove()
                  newComponent.appendChild(element)
                })
              }
            } else if (action === 'unwrap') {
              const element = document.querySelector(
                `[data-harmony-id="${update.componentId}"]`,
              )
              const parent = element?.parentElement
              set((state) => {
                state.cachedElements.push({
                  id,
                  element: element?.cloneNode(true) as HTMLElement,
                  parent: parent!,
                  children: Array.from(element?.children || []),
                })
                return state
              })

              if (!element)
                throw new Error(
                  `makeUpdates: Cannot find from element with componentId ${update.componentId} and childIndex ${update.childIndex}`,
                )
              const children = Array.from(element.children)
              children.forEach((child) => {
                parent?.appendChild(child)
              })
              element.remove()
            }
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
              const img = document.createElement('img')
              img.src = actionValue
              img.dataset.harmonyId = update.componentId
              img.className = ''
              img.style.width = '100px'
              img.style.height = '100px'
              element.replaceWith(img)
            } else {
              element.outerHTML = actionValue
              element.dataset.harmonyId = update.componentId
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
          if (!el) return //throw new Error(`Cannot find element with id ${update.componentId}`)

          const textNodes = Array.from(el.childNodes)
          const index = parseInt(update.name)
          if (isNaN(index)) {
            throw new Error(`Invalid update text element ${update.name}`)
          }
          if (
            textNodes[index]?.textContent !== update.value &&
            textNodes[index]?.textContent === update.oldValue
          ) {
            textNodes[index].textContent = update.value
          }
        }
      }

      //Updates that should happen for every element in a component
      for (const update of translated) {
        const id = update.componentId
        const componentId = id.split('#')[id.split('#').length - 1]
        const sameElements = update.isGlobal
          ? findSameElementsFromId(componentId, rootElement)
          : findElementsFromId(id, rootElement)
        for (const element of Array.from(sameElements)) {
          const childIndex = Array.from(
            element.parentElement!.children,
          ).indexOf(element)
          const htmlElement = element

          //Setting childIndex to -1 means that we want to update all items in a list
          if (
            !update.isGlobal &&
            update.childIndex > -1 &&
            update.childIndex !== childIndex
          )
            continue

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
