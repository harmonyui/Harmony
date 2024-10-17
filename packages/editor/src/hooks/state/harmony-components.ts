import type { HarmonyComponentInfo } from '@harmony/util/src/types/component'
import type { IndexComponentsRequest } from '@harmony/util/src/types/network'
import { mergeArraysOnId } from '@harmony/util/src/utils/common'
import type { ComponentErrorState } from './component-error'
import { createHarmonySlice } from './factory'
import type { DataLayerState } from './data-layer'

export interface HarmonyComponentsState {
  harmonyComponents: HarmonyComponentInfo[]
  updateComponentsFromIds: (
    request: IndexComponentsRequest,
    rootElement: HTMLElement,
  ) => Promise<void>
}

export const createHarmonyComponentSlice = createHarmonySlice<
  HarmonyComponentsState,
  ComponentErrorState & DataLayerState
>((set, get) => ({
  harmonyComponents: [],
  async updateComponentsFromIds(request, rootElement) {
    const currHarmonyComponents = get().harmonyComponents
    const uniqueElements = request.components.filter(
      (component) =>
        !currHarmonyComponents.find((comp) => comp.id === component),
    )
    const { harmonyComponents, errorElements } = await get().indexComponents({
      ...request,
      components: uniqueElements,
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
