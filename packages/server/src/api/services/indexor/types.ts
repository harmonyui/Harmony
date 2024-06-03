import type { ComponentLocation} from "@harmony/util/src/types/component";
import { locationSchema } from "@harmony/util/src/types/component";
import { z } from "zod";

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

export interface HarmonyComponent {
	id: string;
	name: string;
	props: Attribute[];
	isComponent: boolean;
	getParent: () => HarmonyComponent | undefined;
	containingComponent?: HarmonyComponent;
	location: ComponentLocation,
	children: HarmonyComponent[];
}