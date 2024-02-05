import { z } from "zod";

//type: className, name: size
export const updateSchema = z.object({
	componentId: z.string(),
	parentId: z.string(),
	type: z.union([z.literal('className'), z.literal('text'), z.literal('component')]),
	action: z.union([z.literal('add'), z.literal('remove'), z.literal('change')]), 
	name: z.string(),
	value: z.string()
})
export type ComponentUpdate = z.infer<typeof updateSchema>;

export const locationSchema = z.object({
	file: z.string(),
	start: z.number(),
	end: z.number()
})
export type ComponentLocation = z.infer<typeof locationSchema>;

export const attributeSchema = z.object({
	id: z.string(),
	type: z.string(),
	name: z.string(),
	value: z.string(),
	reference: z.union([z.object({name: z.string(), isComponent: z.literal(true)}), z.object({id: z.string(), isComponent: z.boolean(), parentId: z.string()})]),
})
export type Attribute = z.infer<typeof attributeSchema>;

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