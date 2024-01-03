export interface Attribute {
	id: string;
	name: string;
	value: string;
	className: string | undefined;
}

export interface ComponentElement {
	id: string;
	name: string;
	children: ComponentElement[];
	getParent: () => ComponentElement | undefined;
	sourceFile: string;
	lineNumber: number;
	attributes: Attribute[];
	isComponent: boolean;
	element: HTMLElement;
}

export interface HarmonyComponent extends ComponentElement {
	isComponent: true;
}