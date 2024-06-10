import type { ComponentProp, HarmonyComponentInfo } from "@harmony/util/src/types/component";
import type { ComponentElement} from "../../inspector/component-identifier";
import { getComponentElementFiber } from "../../inspector/component-identifier";
import { getFiberName } from "../../inspector/inspector-dev";
import type { HarmonyComponentsState } from "./harmony-components";
import { createHarmonySlice } from "./factory";

export interface ComponentState {
    selectedComponent: ComponentElement | undefined
    rootComponent: ComponentElement | undefined
    selectElement: (element: HTMLElement | undefined) => void
}

export const createComponentStateSlice = createHarmonySlice<ComponentState, HarmonyComponentsState>((set, get) => {
    const updateRootElement = (harmonyComponents: HarmonyComponentInfo[]) => {
        const rootElement = document.getElementById('harmony-section');
        if (!rootElement) {
            throw new Error("Cannot find root element");
        }
            
        const getComponentFromElement = (element: HTMLElement): ComponentElement | undefined => {
            const id = element.dataset.harmonyId
            const harmonyComponent = harmonyComponents.find(c => c.id === id);

            if (harmonyComponent && id) {
                const name = harmonyComponent.name
                const isComponent = harmonyComponent.isComponent;
                const props: ComponentProp[] = harmonyComponent.props;
    
                return {
                    id,
                    element,
                    name,
                    children: getComponentChildren(element),
                    props,
                    isComponent,
                }
            }
    
            const fiber = getComponentElementFiber(element);
    
            if (id === undefined) {
                return undefined;
            }
    
            const name = getFiberName(fiber) || '';
            const isComponent = !fiber?.stateNode;
            const props: ComponentProp[] = []
    
            return {
                id,
                element,
                name,
                children: getComponentChildren(element),
                props,
                isComponent,
            }
        }

        const getComponentChildren = (element: HTMLElement): ComponentElement[] => {
            const children: ComponentElement[] = [];

            const elementChildren = Array.from(element.children);
            for (let i = 0; i < elementChildren.length; i++) {
                const child = elementChildren[i] as HTMLElement;
                if (child.tagName.toLocaleLowerCase() === 'slot') {
                    elementChildren.splice(i, 1, ...Array.from(child.children));
                    i--;
                    continue;
                }

                if (child.id === '__next') {
                    elementChildren.push(...Array.from(child.children));
                    continue;
                }
                
                const childComponent = getComponentFromElement(child);
                if (childComponent) {
                    children.push(childComponent);
                }
            }

            return children;
        }

        const rootComponent = getComponentFromElement(rootElement);
        set({rootComponent});
    }
    
    return {
        state: {
            selectedComponent: undefined,
            rootComponent: undefined,
            selectElement(element: HTMLElement | undefined) {
                const rootComponent = get().rootComponent;
                if (!rootComponent || !element) {
                    set({selectedComponent: undefined});
                    return;
                }

                const findElement = (currComponent: ComponentElement, elementIdToFind: string): ComponentElement | undefined => {
                    if (currComponent.id === elementIdToFind) return currComponent;

                    for (const child of currComponent.children) {
                        const foundInChild = findElement(child, elementIdToFind);
                        if (foundInChild) {
                            return foundInChild;
                        }
                    }

                    return undefined;
                }

                const id = element.dataset.harmonyText === 'true' ? element.parentElement?.dataset.harmonyId : element.dataset.harmonyId;
                const component = findElement(rootComponent, id || '');
                set({selectedComponent: component ? {...component, element} : undefined});
            },
        },
        dependencies: {
            harmonyComponents(harmonyComponents) {
                updateRootElement(harmonyComponents);
            },
        }
    }
});