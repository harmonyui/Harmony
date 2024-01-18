import { ComponentElementBase } from "../../../../../packages/ui/src/types/component";
import { z } from "zod";
import fs from 'node:fs';

export const changesSchema = z.object({
	oldCode: z.string(),
	newCode: z.string(),
	snippetIndex: z.number(),
});

export type Changes = z.infer<typeof changesSchema>;

export async function makeChanges(referencedComponent: ComponentElementBase, newSnippet: string): Promise<void> {
	const file = fs.readFileSync(referencedComponent.location.file, 'utf-8');
	const updatedFile = file.replaceByIndex(newSnippet, referencedComponent.location.start, referencedComponent.location.end);
	fs.writeFileSync(referencedComponent.location.file, updatedFile);
}