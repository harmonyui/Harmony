import { z } from "zod";

export const attributeSchema = z.object({
	id: z.string(),
	type: z.string(),
	name: z.string(),
	value: z.string(),
	className: z.union([z.string(), z.undefined()])
})
export type Attribute = z.infer<typeof attributeSchema>;

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
	parentId: string;
	getParent: () => ComponentElement | undefined;
	element?: HTMLElement;
	containingComponent: HarmonyComponent;
}

export interface HarmonyComponent extends ComponentElementBase {
	isComponent: true;

}