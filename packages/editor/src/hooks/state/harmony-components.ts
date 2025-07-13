import type { HarmonyComponentInfo } from '@harmony/util/src/types/component'
import type { IndexComponentsRequest } from '@harmony/util/src/types/network'
import { mergeArraysOnId } from '@harmony/util/src/utils/common'
import { recurseElements } from '../../utils/element-utils'
import type { ComponentErrorState } from './component-error'
import { createHarmonySlice } from './factory'
import type { DataLayerState } from './data-layer'

export interface HarmonyComponentsState {
  harmonyComponents: HarmonyComponentInfo[]
  updateComponentsFromIds: (
    request: IndexComponentsRequest,
    rootElement: HTMLElement,
  ) => Promise<void>
  initHarmonyComponents: () => void
}

export const createHarmonyComponentSlice = createHarmonySlice<
  HarmonyComponentsState,
  ComponentErrorState & DataLayerState
>((set, get) => ({
  harmonyComponents: [],
  initHarmonyComponents() {
    const components = initHarmonyComponents()
    set({ harmonyComponents: components })
  },
  async updateComponentsFromIds(request, rootElement) {
    const currHarmonyComponents = get().harmonyComponents
    const uniqueElements = request.components.filter(
      (component) =>
        !currHarmonyComponents.find((comp) => comp.id === component),
    )
    const { harmonyComponents, errorElements } = await get().indexComponents({
      ...request,
      components: Array.from(new Set(uniqueElements)),
    })

    get().updateErrorElements(errorElements, rootElement)

    set((state) => {
      const newHarmonyComponents = mergeArraysOnId(
        state.harmonyComponents,
        harmonyComponents,
        'id',
      )

      return {
        harmonyComponents: newHarmonyComponents,
      }
    })
  },
}))

const initHarmonyComponents = (): HarmonyComponentInfo[] => {
  const harmonyComponents: HarmonyComponentInfo[] = []
  recurseElements(document.body, [
    (element) => {
      const harmonyId = element.dataset.harmonyId
      if (harmonyId) {
        harmonyComponents.push({
          id: harmonyId,
          isComponent: false,
          props: [],
          name: element.tagName.toLowerCase(),
          level: 0,
        })
      }
    },
  ])

  return harmonyComponents
}
