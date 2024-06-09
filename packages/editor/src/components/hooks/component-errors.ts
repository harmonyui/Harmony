import type { ComponentError } from "@harmony/util/src/types/component";
import { create } from "zustand";
import { recurseElements } from "../../utils/element-utils";

interface ComponentErrorState {
    errorElements: ComponentError[]
    updateErrorElements: (errorElements: ComponentError[], rootElement: HTMLElement) => void;
}
export const useComponentErrors = create<ComponentErrorState>()((set) => ({
    errorElements: [],
    updateErrorElements(errorElements, rootElement) {
        recurseElements(rootElement, [(element) => {
            const errorComponent = errorElements.find(el => el.componentId === element.dataset.harmonyId)
            if (errorComponent) {
                const type = errorComponent.type;
                element.dataset.harmonyError = type;
            }
        }]);

        set({errorElements});
    }
}))
