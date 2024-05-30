import { stringUnionSchema } from "../utils/common";
import { z } from "zod";

const behaviorTypes = ['dark'] as const;
const behaviorTypesSchema = stringUnionSchema(behaviorTypes);
export type BehaviorType = z.infer<typeof behaviorTypesSchema>;

//type: className, name: size
export const updateSchema = z.object({
	componentId: z.string(),
	childIndex: z.number(),
	type: z.union([z.literal('className'), z.literal('text'), z.literal('component')]),
	action: z.union([z.literal('add'), z.literal('remove'), z.literal('change')]), 
	name: z.string(),
	value: z.string(),
	oldValue: z.string(),
	behavior: z.optional(z.array(behaviorTypesSchema)),
	//Whether or not a certain change affects all components, or just one instance of a component
	isGlobal: z.boolean()
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
	index: z.number(),
	location: locationSchema,
	locationType: z.string(),
	reference: z.object({id: z.string()})
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
	//parentId: string;
	getParent: () => ComponentElement | undefined;
	element?: HTMLElement;
	containingComponent: HarmonyComponent;
}

export interface HarmonyComponent extends ComponentElementBase {
	isComponent: true;

}

export const componentErrorSchema = z.object({
	componentId: z.string(),
	//parentId: z.string(),
	type: z.string()
});

export type ComponentError = z.infer<typeof componentErrorSchema>;