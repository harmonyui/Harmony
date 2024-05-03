"use client";
import React, { useEffect} from "react";
import ReactDOM from "react-dom";
import { DisplayMode, HarmonyProviderProps } from "./harmony-provider";
import { FiberHTMLElement, getElementFiber } from "./inspector/inspector-dev";
import { getComponentElementFiber } from "./inspector/component-identifier";
import { Fiber } from "react-reconciler";
import { Environment, getEditorUrl } from "@harmony/util/src/utils/component";
    
export const HarmonySetup: React.FunctionComponent<Pick<HarmonyProviderProps, 'repositoryId' | 'fonts' | 'environment'> & {local?: boolean}> = ({local=false, ...options}) => {
	const setBranchId = (branchId: string) => {
		const url = new URL(window.location.href);
		if (!url.searchParams.has('branch-id')) {
			url.searchParams.set('branch-id', branchId);
			window.history.replaceState(null, '', url.href);
		}
        window.sessionStorage.setItem('branch-id', branchId);
	}
    
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        let branchId = urlParams.get('branch-id');
        if (!branchId) {
            branchId = window.sessionStorage.getItem('branch-id');
            branchId && setBranchId(branchId);
        };

        if (!branchId) return;

        const environment = urlParams.get('harmony-environment') as Environment | undefined || options.environment;
        
		const result = setupHarmonyProvider();
		if (result) {
			setBranchId(branchId);

			const {harmonyContainer} = result;
			if (!local) {
                createProductionScript({...options, environment}, branchId, harmonyContainer, result.setup);
            } else {
                window.HarmonyProvider({...options, branchId, setup: result.setup}, harmonyContainer);
            }
		}
		
	}, []);
	return (<></>)
}

function createProductionScript(options: Pick<HarmonyProviderProps, 'repositoryId' | 'environment'>, branchId: string, harmonyContainer: HTMLDivElement, setup: Setuper) {
    const script = document.createElement('script');
    const src = `${getEditorUrl(options.environment || 'production')}/bundle.js`
    script.src = src;
    script.addEventListener('load', function load() {
        window.HarmonyProvider({...options, branchId, setup}, harmonyContainer);
    });

    document.body.appendChild(script);
}

function isNativeElement(element: Element): boolean {
    return element.tagName.toLowerCase() !== 'script' && element.id !== 'harmony-container';
}

const appendChild = (container: Element, child: Element | Node) => {
    const childFiber = getElementFiber(child as FiberHTMLElement)
    if (childFiber) {
        const fiber = getComponentElementFiber(child as FiberHTMLElement);
        console.log(fiber);
        //const parentFiber = new ParentFiber();
        let parent: Fiber | null = childFiber as Fiber | undefined || null;
        while (parent !== null) {
            if (parent.elementType === 'body') {
                break;
            }

            // if (parent.tag === 4) {
            //     break;
            // }

            parent = parent.return;
        }
        if (!parent) {
            throw new Error("Cannot find parent")
        }
        if (parent.stateNode instanceof HTMLElement) {
            parent.stateNode = container;
        } //else if (typeof parent.stateNode === 'object' && 'containerInfo' in parent.stateNode) {
            //parent.stateNode.containerInfo = container;
        //} 
        else {
            throw new Error("Invalid state node");
        }
        container.appendChild(child);
        // parentFiber.setFiber(parent);
        // parentFiber.sendChild(containerParent, 0, 0);
        //removeChildFiberAt(fiber.return.return, 0);
        //child.parentElement?.removeChild(child);
        //appendChildFiber(containerFiber, fiber.return);
    } else {
        container.appendChild(child);
    }
}

const createPortal = ReactDOM.createPortal;

export interface Setup {
    setContainer: (container: Element) => void;
    changeMode: (mode: DisplayMode) => void;
}
class Setuper implements Setup {
    private bodyObserver: MutationObserver;
    private mode: DisplayMode = 'preview-full';
    private container: Element | undefined;
    constructor(private harmonyContainer: Element) {
        this.bodyObserver = new MutationObserver(() => undefined);
    }

    public setContainer(container: Element) {
        this.container = container;
    }

    public changeMode(mode: DisplayMode) {
        if (!this.container) return;
        let res = true;
        if (mode === 'preview-full' && this.mode !== 'preview-full') {
            res = this.setupNormalMode(this.container);
        } else if (mode !=='preview-full' && this.mode === 'preview-full') {
            res = this.setupHarmonyMode(this.container);
        }
        if (res)
            this.mode = mode;
    }

    private setupNormalMode(container: Element) {
        for (let i = 0; i < container.children.length; i++) {
            const child = container.children[i];
            if (child && isNativeElement(child)) {
                appendChild(document.body, child);
                i--;
            }
        }
    
        ReactDOM.createPortal = createPortal;
        this.bodyObserver.disconnect();
        this.harmonyContainer.classList.remove('hw-h-full hw-w-full');

        return true;
    }

    private setupHarmonyMode(container: Element): boolean {
        const containerFiber = getElementFiber(container as FiberHTMLElement);
        if (!containerFiber) {
            return false;
        }
        // const containerParent = new ParentFiber();
        // containerParent.setFiber(containerFiber);

        for (let i = 0; i < document.body.children.length; i++) {
            const child = document.body.children[i];
            if (child && isNativeElement(child)) {
                appendChild(container, child);
                i--;
            }
        }
        this.harmonyContainer.className = "hw-h-full hw-w-full";

        ReactDOM.createPortal = function create(children: React.ReactNode, _container: Element | DocumentFragment, key?: string | null | undefined) {
            if (_container === document.body) {
                // eslint-disable-next-line no-param-reassign -- ok
                _container = container;
            }
            
            return createPortal(children, _container, key);
        }

        this.bodyObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                // eslint-disable-next-line @typescript-eslint/no-loop-func -- ok
                mutation.addedNodes.forEach(node => {
                    if (node.parentElement === document.body && isNativeElement(node as Element)) {
                        appendChild(container, node);
                    }
                })
            }
        });
        this.bodyObserver.observe(document.body, {
            'attributeOldValue': true,
            attributes: true,
            characterData: true,
            characterDataOldValue: true,
            childList: true,
            subtree: true,
        });

        return true;
    }
}


export function setupHarmonyProvider(setupHarmonyContainer=true) {
    if (document.getElementById('harmony-container') && setupHarmonyContainer) return undefined;

    let harmonyContainer: HTMLDivElement;
    if (setupHarmonyContainer) {
        harmonyContainer = document.createElement('div');
        harmonyContainer.id = 'harmony-container';
        document.body.appendChild(harmonyContainer);
    } else {
        const _container = document.getElementById("harmony-container") as HTMLDivElement | undefined;
        if (!_container) {
            return undefined;
        }
        harmonyContainer = _container;
    }

	const documentBody = document.body as HTMLBodyElement;

    const setup = new Setuper(harmonyContainer);
    
    //container.className = documentBody.className;
	documentBody.classList.add('hw-h-full');
	document.documentElement.classList.add('hw-h-full');
	//documentBody.contentEditable = 'true';

	//TODO: Probably need to do this for all styles;
	//container.style.backgroundColor = 'white';
    //const {bodyObserver} = setupHarmonyMode(container, harmonyContainer, documentBody);

    return {harmonyContainer, setup};
}