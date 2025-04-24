import type {
  ComponentProp,
  HarmonyComponentInfo,
} from '@harmony/util/src/types/component'
import type { ComponentUpdateWithoutGlobal } from '../../components/harmony-context'
import type { ComponentElement } from '../../components/inspector/component-identifier'
import {
  createComponentId,
  findElementsFromId,
  getComponentIdAndChildIndex,
} from '../../utils/element-utils'
import type { HarmonyComponentsState } from './harmony-components'
import { createHarmonySlice } from './factory'
import type { ComponentUpdateState } from './component-update/slice'
import type { ProjectInfoState } from './project-info'
import type { HarmonyCnState } from './harmonycn'
import { reverseUpdates } from '@harmony/util/src/utils/component'

export type Source = 'document' | 'iframe'
export interface ComponentState {
  selectedComponent: ComponentElement | undefined
  rootComponent: ComponentElement | undefined
  selectElement: (element: HTMLElement | undefined) => void
  hoveredComponent: HTMLElement | undefined
  hoverComponent: (element: HTMLElement | undefined) => void
  globalUpdate: ComponentUpdateWithoutGlobal[] | undefined
  onApplyGlobal: (updates: ComponentUpdateWithoutGlobal[] | undefined) => void
  //This is temporary until we move execute command into zustand
  updateCounter: number
  updateTheCounter: () => void
  source: Source
  setSource: (value: Source) => void
  getNewChildIndex: (parentId: string, rootElement?: HTMLElement) => number
}

export const createComponentStateSlice = createHarmonySlice<
  ComponentState,
  HarmonyComponentsState &
    ComponentUpdateState &
    ProjectInfoState &
    HarmonyCnState
>((set, get) => {
  const getRootElement = (harmonyComponents: HarmonyComponentInfo[]) => {
    const source = get().source

    let rootElement = document.getElementById('harmony-section')
    if (source === 'iframe') {
      const iframeRoot =
        document.getElementsByTagName('iframe')[0].contentDocument?.body
      if (!iframeRoot) {
        throw new Error(
          'Source is set to iframe but cannot find iframe root element',
        )
      }
      rootElement = iframeRoot
    }

    if (get().isOverlay) {
      rootElement = document.body
    }

    if (!rootElement) {
      throw new Error('Cannot find root element')
    }

    const getComponentFromElement = (
      element: HTMLElement,
    ): ComponentElement | undefined => {
      if (element.tagName.toLocaleLowerCase() === 'script') {
        return undefined
      }

      let id = element.dataset.harmonyId
      let childIndex = Number(element.dataset.harmonyChildIndex)

      // If the element doesn't have an id, we need to create one
      if (
        !id &&
        !get().isRepositoryConnected &&
        element.dataset.harmonyText !== 'true'
      ) {
        id = createComponentId(element)
        element.dataset.harmonyId = id
      }

      const harmonyComponent = harmonyComponents.find((c) => c.id === id)

      if (harmonyComponent && id) {
        const name = harmonyComponent.name
        const isComponent = harmonyComponent.isComponent
        const props: ComponentProp[] = harmonyComponent.props
        if (isNaN(childIndex)) {
          childIndex = get().getNewChildIndex(id)
        }

        return {
          id,
          childIndex,
          element,
          name,
          children: getComponentChildren(element),
          props,
          isComponent,
        }
      }

      //const fiber = getComponentElementFiber(element)

      //const name = getFiberName(fiber) || ''
      //const isComponent = !fiber?.stateNode
      const props: ComponentProp[] = []

      return {
        id: id || '',
        childIndex,
        element,
        name: element.tagName.toLowerCase(),
        children: getComponentChildren(element),
        props,
        isComponent: false,
      }
    }

    const getComponentChildren = (element: HTMLElement): ComponentElement[] => {
      const children: ComponentElement[] = []

      const elementChildren = Array.from(element.children)
      for (let i = 0; i < elementChildren.length; i++) {
        const child = elementChildren[i] as HTMLElement
        if (child.tagName.toLocaleLowerCase() === 'slot') {
          elementChildren.splice(i, 1, ...Array.from(child.children))
          i--
          continue
        }

        if (child.id === '__next') {
          elementChildren.push(...Array.from(child.children))
          continue
        }

        const childComponent = getComponentFromElement(child)
        if (childComponent) {
          children.push(childComponent)
        }
      }

      return children
    }

    const rootComponent = getComponentFromElement(rootElement)

    return rootComponent
  }
  const updateRootElement = (harmonyComponents: HarmonyComponentInfo[]) => {
    const rootComponent = getRootElement(harmonyComponents)
    set({ rootComponent })
  }

  return {
    state: {
      selectedComponent: undefined,
      hoveredComponent: undefined,
      rootComponent: undefined,
      source: 'document',
      setSource(value: Source) {
        set({ source: value })
      },
      getNewChildIndex(parentId: string, rootElement?: HTMLElement) {
        const amountOfIndexes = findElementsFromId(
          parentId,
          rootElement ?? get().rootComponent?.element,
        ).length
        return amountOfIndexes
      },
      hoverComponent(element: HTMLElement | undefined) {
        set({ hoveredComponent: element })
      },
      selectElement(element: HTMLElement | undefined) {
        const rootComponent = get().rootComponent
        if (!rootComponent || !element) {
          set({ selectedComponent: undefined })
          return
        }

        const { componentId: id, childIndex } =
          getComponentIdAndChildIndex(element)

        const component = findElement(rootComponent, id, childIndex)
        set({
          selectedComponent: component ? { ...component, element } : undefined,
        })
      },
      updateCounter: 0,
      updateTheCounter() {
        set({ updateCounter: get().updateCounter + 1 })
      },
      globalUpdate: undefined,
      onApplyGlobal: (updates: ComponentUpdateWithoutGlobal[] | undefined) => {
        if (!updates) return set({ globalUpdate: undefined })
        const components = updates.map((update) =>
          get().harmonyComponents.find(
            (component) => component.id === update.componentId,
          ),
        )
        const globalChange = components.some((component) => {
          const updateType = updates.find(
            (update) => update.componentId === component?.id,
          )?.type
          const prop = component?.props.find(
            (_prop) => _prop.name === updateType,
          )
          return prop && !prop.isEditable
        })
        if (globalChange) {
          set({ globalUpdate: updates })
        }
      },
    },
    dependencies: {
      harmonyComponents(harmonyComponents) {
        updateRootElement(harmonyComponents)
      },
      componentUpdates() {
        updateRootElement(get().harmonyComponents)
      },
      createdElements() {
        updateRootElement(get().harmonyComponents)
      },
      activeComponents() {
        //For some reason the components are not mounted immediately
        setTimeout(() => updateRootElement(get().harmonyComponents))
      },
      isInitialized(curr, prev) {
        if (curr && !prev) {
          updateRootElement(get().harmonyComponents)
        }
        if (!curr && prev) {
          void get().makeUpdates(
            reverseUpdates(get().componentUpdates),
            get().rootComponent?.element,
          )
        }
      },
    },
  }
})

export const findElement = (
  currComponent: ComponentElement,
  elementIdToFind: string,
  childIndexToFind: number,
): ComponentElement | undefined => {
  if (
    currComponent.id === elementIdToFind &&
    currComponent.childIndex === childIndexToFind
  )
    return currComponent

  for (const child of currComponent.children) {
    const foundInChild = findElement(child, elementIdToFind, childIndexToFind)
    if (foundInChild) {
      return foundInChild
    }
  }

  return undefined
}
