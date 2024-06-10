import type { ComponentUpdate } from "@harmony/util/src/types/component";
import { createHarmonySlice } from "./factory";

export interface ComponentUpdateState {
    componentUpdates: ComponentUpdate[],
    updateComponentUpdates: (value: ComponentUpdate[]) => void;
}

export const createComponentUpdateSlice = createHarmonySlice<ComponentUpdateState>((set) => ({
    componentUpdates: [],
    updateComponentUpdates(value) {
        set({componentUpdates: value});
    }
}));