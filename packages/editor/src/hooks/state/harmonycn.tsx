import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import type { RegistryComponent } from '../../utils/harmonycn/types'
import { recurseElements } from '../../utils/element-utils'
import { createHarmonySlice } from './factory'

export interface HarmonyCnState {
  activeComponents: {
    componentId: string
    childIndex: number
    root: Root
    placeholder: HTMLElement
  }[]
  mountComponent: (props: {
    componentId: string
    childIndex: number
    name: string
    parentElement: HTMLElement
    index: number
  }) => void
  removeComponent: (componentId: string, childIndex: number) => void
  registry: RegistryComponent[]
  initializeRegistry: (components: RegistryComponent[]) => void
}
export const createHarmonyCnSlice = createHarmonySlice<HarmonyCnState>(
  (set, get) => ({
    activeComponents: [],
    registry: [],
    initializeRegistry(components: RegistryComponent[]) {
      set(() => {
        return {
          registry: components,
        }
      })
    },
    mountComponent({ componentId, childIndex, name, parentElement, index }) {
      const placeholder = document.createElement('div')

      // Step 2: Insert the placeholder into the parent element at the desired position
      const children = parentElement.children
      if (index < children.length) {
        parentElement.insertBefore(placeholder, children[index])
      } else {
        parentElement.appendChild(placeholder)
      }
      placeholder.dataset.harmonyId = componentId
      placeholder.dataset.harmonyChildIndex = String(childIndex)

      const registryComponent = get().registry.find(
        (component) => component.name === name,
      )
      if (!registryComponent) {
        throw new Error(`Component ${name} not found in registry`)
      }

      const Component = registryComponent.component
      const root = createRoot(placeholder)
      root.render(
        <Component
          {...registryComponent.defaultProps}
          data-harmony-id={componentId}
        />,
      )

      setTimeout(() => {
        set((state) => {
          return {
            activeComponents: [
              ...state.activeComponents,
              { root, placeholder, componentId, childIndex },
            ],
          }
        })
        Array.from(placeholder.children).forEach((child) =>
          recurseElements(child as HTMLElement, [
            (element) => {
              element.dataset.harmonyChildIndex = String(childIndex)
            },
          ]),
        )
      })

      return { root, placeholder }
    },
    removeComponent(componentId, childIndex) {
      set((state) => {
        const componentIndex = state.activeComponents.findIndex(
          (component) =>
            component.componentId === componentId &&
            component.childIndex === childIndex,
        )
        if (componentIndex === -1) {
          return state
        }

        const component = state.activeComponents[componentIndex]
        component.root.unmount()
        component.placeholder.remove()

        return {
          activeComponents: state.activeComponents.filter(
            (_, index) => index !== componentIndex,
          ),
        }
      })
    },
  }),
)
