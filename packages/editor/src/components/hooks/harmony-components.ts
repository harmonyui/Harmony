import type { HarmonyComponentInfo } from '@harmony/util/src/types/component';
import { create } from 'zustand';
import type { IndexComponentsRequest } from '@harmony/util/src/types/network';
import { mergeArraysOnId } from '@harmony/util/src/utils/common';
import { indexComponents } from '../../data-layer';
import { useComponentErrors } from './component-errors';

interface HarmonyComponentsState {
    harmonyComponents: HarmonyComponentInfo[]
    updateComponentsFromIds: (request: IndexComponentsRequest, rootElement: HTMLElement) => Promise<void>
}

export const useHarmonyComponents = create<HarmonyComponentsState>()((set) => ({
    harmonyComponents: [],
    errorElements: [],
    async updateComponentsFromIds(request, rootElement) {
        const {harmonyComponents, errorElements} = await indexComponents(request);
        useComponentErrors.getState().updateErrorElements(errorElements, rootElement);

        set((state) => {
            const newHarmonyComponents = mergeArraysOnId(state.harmonyComponents, harmonyComponents, 'id');

            return {
                harmonyComponents: newHarmonyComponents,
            };
        })
    }
}))