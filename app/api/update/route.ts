import { Attribute, ComponentElement, ComponentElementBase, ComponentLocation, HarmonyComponent } from '@harmony/types/component';
import fs from 'node:fs';
import { info } from '../load/route';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI();

const changesSchema = z.object({
	oldCode: z.string(),
	newCode: z.string(),
	snippetIndex: z.number(),
});

const getCodeSnippet = ({file, start, end}: ComponentLocation): string => {
	const fileContent = fs.readFileSync(file, 'utf8');

	return fileContent.substring(start, end);
}

export async function POST(req: Request): Promise<Response> {
	const body = await req.json() as {id: string, oldValue: Attribute[], newValue: Attribute[]};
	const possibleComponents: ComponentElementBase[] = [];
	const component = info.elementInstances.find(el => el.id === body.id);
	if (component === undefined) {
		throw new Error('Cannot find component with id ' + body.id);
	}
	
	possibleComponents.push(component.containingComponent);
	possibleComponents.push(...info.elementInstances.filter(el => el.name === component.containingComponent.name));
	
	const elementSnippet = getCodeSnippet(component.location);
	const possibleComponentsSnippets = possibleComponents.map(({location}) => getCodeSnippet(location));

	const response = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		messages: [
			{role: 'system', content: 'You are a front end React developer tasked with making edits to a code base.'},
			{role: 'user', content:
				`Given a React codebase, I need to make a specific edit to the code to update a static property on the DOM. I do not know what the change is or where exactly it should be, but it could be right at the element level or as a property passed to a component. Here are possible code snippets where the change should occur:

${JSON.stringify(possibleComponentsSnippets)}

The change I want to make is to update the text/content of a specific DOM element or component property to '${body.newValue[0].value}' where the previous value is '${body.oldValue[0].value}'.

Please analyze the given code snippets, identify the correct location for this edit, and make that edit. It might not necessarily be right at the DOM element; it could involve modifying a component property or variable. Remember that this is a static change and should not introduce any unecessary complexity.

Provide the old code, the updated code, and the index of which code snippet the change occurs in this JSON format: {oldCode: string, newCode: string, snippetIndex: number}`}
		],
	})
	if (response.choices[0].finish_reason === 'stop' && response.choices[0].message.content) {
		const parsed = changesSchema.safeParse(JSON.parse(response.choices[0].message.content));
		if (!parsed.success) throw new Error('Invalid response from openai');
		const {oldCode, newCode, snippetIndex} = parsed.data;

		const referencedComponent = possibleComponents[snippetIndex];
		const referencedSnippet = possibleComponentsSnippets[snippetIndex];
		if (referencedComponent === undefined || referencedSnippet === undefined) {
			throw new Error('Invalid response from openai');
		}

		const newSnippet = referencedSnippet.replace(oldCode, newCode);
		const file = fs.readFileSync(referencedComponent.location.file, 'utf-8');
		const updatedFile = file.replaceByIndex(newSnippet, referencedComponent.location.start, referencedComponent.location.end);
		fs.writeFileSync(referencedComponent.location.file, updatedFile);
	} else {
		throw new Error('Invalid response from openai');
	}

	return new Response(JSON.stringify({}), {
		status: 200,
	})
}