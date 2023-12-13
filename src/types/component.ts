export interface Attribute {
	name: string;
	value: string;
}

export interface ComponentElement {
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