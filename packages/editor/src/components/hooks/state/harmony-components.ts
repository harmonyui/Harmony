import type { HarmonyComponentInfo } from '@harmony/util/src/types/component';
import type { IndexComponentsRequest } from '@harmony/util/src/types/network';
import { mergeArraysOnId } from '@harmony/util/src/utils/common';
import { indexComponents } from '../../../data-layer';
import type { ComponentErrorState } from './component-error';
import { createHarmonySlice } from './factory';

export interface HarmonyComponentsState {
    harmonyComponents: HarmonyComponentInfo[]
    updateComponentsFromIds: (request: IndexComponentsRequest, rootElement: HTMLElement) => Promise<void>
}

export const createHarmonyComponentSlice = createHarmonySlice<HarmonyComponentsState, ComponentErrorState>((set, get) => ({
    harmonyComponents: [],
    async updateComponentsFromIds(request, rootElement) {
        const {harmonyComponents, errorElements} = await indexComponents(request);

        get().updateErrorElements(errorElements, rootElement);
       
        set((state) => {
            const newHarmonyComponents = mergeArraysOnId(state.harmonyComponents, harmonyComponents, 'id');
            
            return {
                harmonyComponents: newHarmonyComponents,
            };
        })
    }
}));