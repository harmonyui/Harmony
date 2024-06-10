import type { ComponentUpdate } from "@harmony/util/src/types/component";
import { createHarmonySlice } from "./factory";

export interface ComponentUpdateState {
    componentUpdates: ComponentUpdate[],
    addComponentUpdates: (values: ComponentUpdate[]) => void
}

export const createComponentUpdateSlice = createHarmonySlice<ComponentUpdateState>((set) => ({
    componentUpdates: [],
    addComponentUpdates(value) {
        set(state => {
            const copy = state.componentUpdates.slice();
            copy.push(...value);
            return {
                componentUpdates: copy
            }
        })
    }
}));