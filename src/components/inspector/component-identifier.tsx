import { ComponentElement } from "../../types/component";
import { FiberHTMLElement, getCodeInfoFromFiber, getElementFiber, getElementInspect, getFiberName } from "./inspector-dev";

export interface ComponentIdentifier {
	getComponentFromElement: (element: HTMLElement) => ComponentElement
	//getComponentTree: (rootElement: HTMLElement) => ComponentElement | undefined
}

export class ReactComponentIdentifier implements ComponentIdentifier {
	private rootComponent: ComponentElement | undefined;

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

	public getComponentFromElement(element: HTMLElement): ComponentElement {
		const fiber = getElementFiber(element as FiberHTMLElement);
		const name = getFiberName(fiber) || '';
		const codeInfo = getCodeInfoFromFiber(fiber);
		const sourceFile = codeInfo?.absolutePath || '';
		const lineNumber = !isNaN(Number(codeInfo?.lineNumber)) ? Number(codeInfo?.lineNumber) : -1;
		const isComponent = Boolean(fiber?.stateNode);

		//const parent = element.parentElement ? this.getComponentFromElement(element.parentElement) : undefined;
		const getParent = () => {
			return element.parentElement ? this.getComponentFromElement(element.parentElement) : undefined
		}
		return {
			element,
			name,
			getParent,
			sourceFile,
			lineNumber,
			children: this.getComponentChildren(element),
			attributes: [],
			isComponent
		}
	}

	private getComponentChildren(element: HTMLElement): ComponentElement[] {
		const children: ComponentElement[] = [];
		for (let i = 0; i < element.children.length; i++) {
			const child = element.children[i] as HTMLElement;
			children.push(this.getComponentFromElement(child))
		}

		return children;
	}
}