import type { Fiber } from "react-reconciler";
import type { ComponentProp } from "@harmony/util/src/types/component";
import { getElementFiberUpward, getFiberName, getReferenceFiber } from "./inspector-dev";

export interface ComponentElement {
	id: string;
	name: string;
	props: ComponentProp[];
	isComponent: boolean;
	element: HTMLElement;
	children: ComponentElement[]
}

export interface ComponentIdentifier {
	getComponentFromElement: (element: HTMLElement) => ComponentElement | undefined;
}

export const getComponentElementFiber = (element: HTMLElement): Fiber | undefined => {
	const fiber = getElementFiberUpward(element)
    const referenceFiber = getReferenceFiber(fiber)
	return referenceFiber
}

export class ReactComponentIdentifier implements ComponentIdentifier {
	public getComponentFromElement(element: HTMLElement): ComponentElement| undefined {
		const fiber = getComponentElementFiber(element);
		
		const id = element.dataset.harmonyId;
		if (id === undefined) {
			return undefined;
		}

		const name = getFiberName(fiber) || '';
		const isComponent = !fiber?.stateNode;
		const props: ComponentProp[] = this.getComponentAttributes(element);
		
		return {
			id,
			element,
			name,
			children: this.getComponentChildren(element),
			props,
			isComponent,
		}
	}

	private getComponentAttributes(element: HTMLElement): ComponentProp[] {
		const attributes: ComponentProp[] = [];
		for (const node of Array.from(element.childNodes)) {
			if (node.nodeType === Node.TEXT_NODE) {
				//attributes.push({id: `text-${i}`, type: 'text', name: `${i}`, value: node.textContent ?? ''});
			}
		}
		

		return attributes;
	}

	private getComponentChildren(element: HTMLElement): ComponentElement[] {
		const children: ComponentElement[] = [];
		
		const elementChildren = Array.from(element.children);
		for (let i = 0; i < elementChildren.length; i++) {
			const child = elementChildren[i] as HTMLElement;
			if (child.tagName.toLocaleLowerCase() === 'slot') {
				elementChildren.splice(i, 1, ...Array.from(child.children));
				i--;
				continue;
			}
			
			const childComponent = this.getComponentFromElement(child);
			if (childComponent) { 
				children.push(childComponent);
			}
		}

		return children;
	}
}