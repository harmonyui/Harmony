import { Fiber } from "react-reconciler";
import { Attribute, ComponentElement } from "../../types/component";
import { TailwindAttributeTranslator } from "../harmony-provider";
import { FiberHTMLElement, getCodeInfoFromFiber, getElementFiber, getElementFiberUpward, getElementInspect, getFiberName, getNamedFiber, getReferenceFiber } from "./inspector-dev";

export interface ComponentIdentifier {
	getComponentFromElement: (element: HTMLElement) => ComponentElement;
	//getComponentTree: (rootElement: HTMLElement) => ComponentElement | undefined
}

const getComponentElementFiber = (element: HTMLElement): Fiber | undefined => {
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

	public getComponentFromElement(element: HTMLElement): ComponentElement {
		const fiber = getComponentElementFiber(element);
		const elementFiber = getElementFiber(element as FiberHTMLElement);
		
		const id = fiber?.key || nextId();
		const name = getFiberName(fiber) || '';
		const codeInfo = getCodeInfoFromFiber(elementFiber);
		const sourceFile = codeInfo?.absolutePath || '';
		const lineNumber = !isNaN(Number(codeInfo?.lineNumber)) ? Number(codeInfo?.lineNumber) : -1;
		const isComponent = !Boolean(fiber?.stateNode);
		const className = typeof element.className === 'string' ? element.className : ''//typeof props === 'object' && 'className' in props && typeof props.className === 'string' ? props.className as string : '';
		const attributes: Attribute[] = className ? TailwindAttributeTranslator.translateCSSAttributes(className) : [];
		
		//const parent = element.parentElement ? this.getComponentFromElement(element.parentElement) : undefined;
		const getParent = () => {
			return element.parentElement ? this.getComponentFromElement(element.parentElement) : undefined
		}
		return {
			id,
			element,
			name,
			getParent,
			sourceFile,
			lineNumber,
			children: this.getComponentChildren(element),
			attributes,
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

let currId = 0;
const nextId = () => {
	return String(currId++);
}