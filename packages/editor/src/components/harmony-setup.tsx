import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { HarmonyProvider, HarmonyProviderProps } from "./harmony-provider";

export const HarmonySetup: React.FunctionComponent<Pick<HarmonyProviderProps, 'repositoryId'> & {local?: boolean}> = ({local=false, ...options}) => {
	const setBranchId = (branchId: string | undefined) => {
		const url = new URL(window.location.href);
		if (branchId && !url.searchParams.has('branch-id')) {
			url.searchParams.set('branch-id', branchId);
			window.history.replaceState(null, '', url.href);
		}
	}
    
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const branchId = urlParams.get('branch-id');
        if (!branchId) return;
        
		const result = setupHarmonyProvider();
		if (result) {
			setBranchId(branchId);

			const {container, harmonyContainer} = result;
			if (!local) {
                createProductionScript(options, branchId, container, harmonyContainer);
            } else {
                ReactDOM.render(React.createElement(HarmonyProvider, {...options, rootElement: container, branchId}), harmonyContainer);
            }
		}
		
	}, []);
	return (<></>)
}

function createProductionScript(options: Pick<HarmonyProviderProps, 'repositoryId'>, branchId: string, container: HTMLElement, harmonyContainer: HTMLDivElement) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/harmony-ai-editor@latest/dist/editor/bundle.js';
    script.addEventListener('load', function() {
        window.HarmonyProvider({...options, rootElement: container, branchId}, harmonyContainer);
    });

    document.body.appendChild(script);
}

function isNativeElement(element: Element): boolean {
    return element.tagName.toLowerCase() !== 'script' && element.id !== 'harmony-container';
}

const createPortal = ReactDOM.createPortal;
let bodyObserver: MutationObserver;
export function setupHarmonyMode(container: Element, harmonyContainer: HTMLElement, body: HTMLBodyElement) {
    for (let i = 0; i < body.children.length; i++) {
        const child = body.children[i];
        if (isNativeElement(child)) {
            container.appendChild(child);
			i--;
        }
    }
    harmonyContainer.className = "hw-h-full";

    ReactDOM.createPortal = function(children: React.ReactNode, _container: Element | DocumentFragment, key?: string | null | undefined) {
		if (_container === document.body) {
			_container = container;
		}
		
		return createPortal(children, _container, key);
	}

    bodyObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            mutation.addedNodes.forEach(node => {
                if (node.parentElement === document.body && isNativeElement(node as Element)) {
					container.appendChild(node);
                }
            })
        }
    });
    bodyObserver.observe(document.body, {
        'attributeOldValue': true,
        attributes: true,
        characterData: true,
        characterDataOldValue: true,
        childList: true,
        subtree: true,
    });
}

export function setupNormalMode(container: Element, harmonyContainer: HTMLElement, body: HTMLBodyElement) {
    for (let i = 0; i < container.children.length; i++) {
        const child = container.children[i];
        if (isNativeElement(child)) {
            body.appendChild(child);
			i--;
        }
    }

    ReactDOM.createPortal = createPortal;
    bodyObserver.disconnect();
    harmonyContainer.classList.remove('hw-h-full');
}

export function setupHarmonyProvider(setupHarmonyContainer=true) {
    if (document.getElementById('harmony-container') && setupHarmonyContainer) return undefined;

    let harmonyContainer: HTMLDivElement;
    if (setupHarmonyContainer) {
        harmonyContainer = document.createElement('div');
        harmonyContainer.id = 'harmony-container';
        document.body.appendChild(harmonyContainer);
    } else {
        harmonyContainer = document.getElementById("harmony-container") as HTMLDivElement;
        if (!harmonyContainer) {
            return undefined;
        }
    }

	const documentBody = document.body as HTMLBodyElement;
	
    const container = document.createElement('body');
    container.className = documentBody.className;
	documentBody.classList.add('hw-h-full');
	document.documentElement.classList.add('hw-h-full');
	//documentBody.contentEditable = 'true';

	//TODO: Probably need to do this for all styles;
	container.style.backgroundColor = 'white';
	setupHarmonyMode(container, harmonyContainer, documentBody);

    return {container, harmonyContainer};
}