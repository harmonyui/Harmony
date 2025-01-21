import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { mergeArraysOnId } from '@harmony/util/src/utils/common'
import type { HarmonyComponentInfo } from '@harmony/util/src/types/component'
import type {
  CreatedComponent,
  RegistryComponent,
} from '../../utils/harmonycn/types'
import { recurseElements } from '../../utils/element-utils'
import { createHarmonySlice } from './factory'
import type { HarmonyComponentsState } from './harmony-components'

export interface HarmonyCnState {
  activeComponents: {
    componentId: string
    childIndex: number
    root: Root
  }[]
  mountComponent: (props: {
    componentId: string
    childIndex: number
    name: string
    parentElement: HTMLElement
    index: number
  }) => Promise<CreatedComponent>
  removeComponent: (componentId: string, childIndex: number) => void
  registry: RegistryComponent[]
  initializeRegistry: (components: RegistryComponent[]) => void
}
export const createHarmonyCnSlice = createHarmonySlice<
  HarmonyCnState,
  HarmonyComponentsState
>((set, get) => ({
  activeComponents: [],
  registry: [],
  initializeRegistry(components: RegistryComponent[]) {
    set({
      registry: components,
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

    //For some reason there is a delay when mounting the component
    return new Promise<CreatedComponent>((resolve) => {
      setTimeout(() => {
        set((state) => {
          return {
            activeComponents: [
              ...state.activeComponents,
              { root, componentId, childIndex },
            ],
          }
        })
        const harmonyComponents: HarmonyComponentInfo[] = []
        let createdComponent: CreatedComponent | undefined
        Array.from(placeholder.children).forEach((child, cIndx) => {
          recurseElements(child as HTMLElement, [
            (element) => {
              element.dataset.harmonyChildIndex = String(childIndex)
            },
          ])
          const _componentId = (child as HTMLElement).dataset.harmonyId || ''
          createdComponent = createdComponent ?? {
            componentId: _componentId,
            childIndex,
            element: child as HTMLElement,
          }
          harmonyComponents.push({
            id: _componentId,
            name,
            isComponent: true,
            props: registryComponent.props,
          })
          //Get rid of the placeholder div
          if (index < children.length) {
            parentElement.insertBefore(child, children[index + cIndx])
          } else {
            parentElement.appendChild(child)
          }
        })

        placeholder.remove()
        if (!createdComponent) {
          throw new Error('Component not created')
        }

        set((state) => ({
          harmonyComponents: mergeArraysOnId(
            state.harmonyComponents,
            harmonyComponents,
            'id',
          ),
        }))
        resolve(createdComponent)
      })
    })
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

      return {
        activeComponents: state.activeComponents.filter(
          (_, index) => index !== componentIndex,
        ),
      }
    })
  },
}))
