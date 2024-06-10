import type { ComponentError } from "@harmony/util/src/types/component";
import { mergeArraysOnId } from "@harmony/util/src/utils/common";
import { recurseElements } from "../../../utils/element-utils";
import { createHarmonySlice } from "./factory";

export interface ComponentErrorState {
    errorElements: ComponentError[]
    updateErrorElements: (errorElements: ComponentError[], rootElement: HTMLElement) => void;
}
export const createComponentErrorsSlice = createHarmonySlice<ComponentErrorState>((set) => ({
    errorElements: [],
    updateErrorElements(errorElements, rootElement) {
        recurseElements(rootElement, [(element) => {
            const errorComponent = errorElements.find(el => el.componentId === element.dataset.harmonyId)
            if (errorComponent) {
                const type = errorComponent.type;
                element.dataset.harmonyError = type;
            }
        }]);

        set((state) => {
            const newErrors = mergeArraysOnId(state.errorElements, errorElements, 'componentId');
            return {
                errorElements: newErrors
            }
        });
    }
}));
