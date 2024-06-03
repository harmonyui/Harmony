import { z } from "zod";
import { stringUnionSchema } from "../utils/common";

const behaviorTypes = ['dark'] as const;
const behaviorTypesSchema = stringUnionSchema(behaviorTypes);
export type BehaviorType = z.infer<typeof behaviorTypesSchema>;
const updateTypes = ['className', 'text', 'component'] as const;
const updateTypesSchema = stringUnionSchema(updateTypes);

//type: className, name: size
export const updateSchema = z.object({
	componentId: z.string(),
	childIndex: z.number(),
	type: updateTypesSchema,
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

export const componentPropSchema = z.object({
	componentId: z.string(),
	type: updateTypesSchema,
	propName: z.string(),
	propValue: z.string(),
	isStatic: z.boolean(),
})
export type ComponentProp = z.infer<typeof componentPropSchema>;

/** Passed to front-end */
export const harmonyComponentInfoSchema = z.object({
	id: z.string(),
	name: z.string(),
	props: z.array(componentPropSchema),
	isComponent: z.boolean()
});
export type HarmonyComponentInfo = z.infer<typeof harmonyComponentInfoSchema>;

export const componentErrorSchema = z.object({
	componentId: z.string(),
	type: z.string()
});

export type ComponentError = z.infer<typeof componentErrorSchema>;