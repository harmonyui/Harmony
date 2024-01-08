export interface Attribute {
	id: string;
	name: string;
	value: string;
	className: string | undefined;
}

export interface ComponentLocation {
	file: string;
	start: number;
	end: number;
}

export interface ComponentElementBase {
	id: string;
	name: string;
	children: ComponentElement[];
	location: ComponentLocation,
	attributes: Attribute[];
	isComponent: boolean;
}

export interface ComponentElement extends ComponentElementBase {
	getParent: () => ComponentElement | undefined;
	element?: HTMLElement;
	containingComponent: HarmonyComponent;
}

export interface HarmonyComponent extends ComponentElementBase {
	isComponent: true;

}