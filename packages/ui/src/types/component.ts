import { z } from "zod";

export const attributeSchema = z.object({
	id: z.string(),
	type: z.string(),
	name: z.string(),
	value: z.string(),
	className: z.union([z.string(), z.undefined()])
})
export type Attribute = z.infer<typeof attributeSchema>;

export const updateSchema = z.object({
	componentId: z.string(),
	parentId: z.string(),
	type: z.union([z.literal('className'), z.literal('text'), z.literal('change')]),
	action: z.union([z.literal('add'), z.literal('remove'), z.literal('change')]),
	name: z.string(),
	value: z.string()
})
export type ComponentUpdate = z.infer<typeof updateSchema>;

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