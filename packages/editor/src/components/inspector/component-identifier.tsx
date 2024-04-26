import { Fiber } from "react-reconciler";
import { FiberHTMLElement, getCodeInfoFromFiber, getElementFiber, getElementFiberUpward, getFiberName, getReferenceFiber } from "./inspector-dev";
import { Attribute, ComponentElement } from "@harmony/util/src/types/component";

export interface ComponentIdentifier {
	getComponentFromElement: (element: HTMLElement) => ComponentElement | undefined;
	//getComponentTree: (rootElement: HTMLElement) => ComponentElement | undefined
}

export const getComponentElementFiber = (element: HTMLElement): Fiber | undefined => {
	//const fiber = getElementFiber(element as FiberHTMLElement);
	// //If the fiber of an html element is the first element in a component, just return the component
	// if (fiber?.return && typeof fiber.return.type === 'function') {
	// 	return fiber.return;
	// }

	// return fiber;

	const fiber = getElementFiberUpward(element)
  const referenceFiber = getReferenceFiber(fiber)
	return referenceFiber
}

export class ReactComponentIdentifier implements ComponentIdentifier {
	// public getComponentTree(rootElement: HTMLElement): ComponentElement | undefined {
	// 	let node = getElementFiber(rootElement as FiberHTMLElement);
	// 	if (node === undefined) return undefined;

	// 	let children: ComponentElement[] = [];
	// 	const type = node.type as string | Function;
	// 	if (typeof type === 'function') {
	// 		children.push({content: type.name, items: node.child ? buildTreeViewItems(node.child) : []});
	// 		if (node.sibling) {
	// 			items = items.concat(buildTreeViewItems(node.sibling));
	// 		}
	// 	} else {
	// 		return node.child ? buildTreeViewItems(node.child) : [];
	// 	}

	// 	return items;
	// }

	public getComponentFromElement(element: HTMLElement): ComponentElement| undefined {
		const fiber = getComponentElementFiber(element);
		const elementFiber = getElementFiber(element as FiberHTMLElement);
		
		const id = element.dataset.harmonyId;//fiber?.key || nextId();
		const parentId = element.dataset.harmonyParentId || '';
		if (id === undefined) {
			return undefined;
		}

		const name = getFiberName(fiber) || '';
		const codeInfo = getCodeInfoFromFiber(elementFiber);
		const sourceFile = codeInfo?.absolutePath || '';
		//const lineNumber = !isNaN(Number(codeInfo?.lineNumber)) ? Number(codeInfo?.lineNumber) : -1;
		const isComponent = !fiber?.stateNode;
		const attributes: Attribute[] = this.getComponentAttributes(element);
		
		//const parent = element.parentElement ? this.getComponentFromElement(element.parentElement) : undefined;
		const getParent = () => {
			return element.parentElement ? this.getComponentFromElement(element.parentElement) : undefined
		}
		return {
			id,
			parentId,
			element,
			name,
			getParent,
			location: {
				file: sourceFile,
				start: 0,
				end: 0
			},
			children: this.getComponentChildren(element),
			attributes,
			isComponent,
			containingComponent: {
				id: '',
				attributes: [],
				name: '',
				isComponent: true,
				location: {
					file: '',
					start: 0,
					end: 0,
				},
				children: []
			}
		}
	}

	private getComponentAttributes(element: HTMLElement): Attribute[] {
		const attributes: Attribute[] = [];
		for (const node of Array.from(element.childNodes)) {
			if (node.nodeType === Node.TEXT_NODE) {
				//attributes.push({id: `text-${i}`, type: 'text', name: `${i}`, value: node.textContent ?? ''});
			}
		}
		

		return attributes;
	}

	private getComponentChildren(element: HTMLElement): ComponentElement[] {
		const children: ComponentElement[] = [];
		// eslint-disable-next-line @typescript-eslint/prefer-for-of -- ok
		for (let i = 0; i < element.children.length; i++) {
			const child = element.children[i] as HTMLElement;
			const childComponent = this.getComponentFromElement(child);
			if (childComponent) { 
				children.push(childComponent);
			}
		}

		return children;
	}
}