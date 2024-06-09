import type { ComponentUpdate } from "@harmony/util/src/types/component";
import type { StateCreator } from "zustand";

export interface ComponentUpdateState {
    componentUpdates: ComponentUpdate[],
    updateComponentUpdates: (value: ComponentUpdate[]) => void;
}

export const createComponentUpdateSlice: StateCreator<ComponentUpdateState> = (set) => ({
    componentUpdates: [],
    updateComponentUpdates(value) {
        set({componentUpdates: value});
    }
})