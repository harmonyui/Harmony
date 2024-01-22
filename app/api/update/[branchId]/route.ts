import { Attribute, ComponentElement, ComponentElementBase, ComponentLocation, HarmonyComponent, attributeSchema } from '../../../../packages/ui/src/types/component';
import fs from 'node:fs';
import OpenAI from 'openai';
import { z } from 'zod';
import { changesSchema } from '../../../../src/server/api/services/updator/local';
import { prisma } from '../../../../src/server/db';
import { Prisma } from '@prisma/client';
import { getCodeSnippet } from '../../../../src/server/api/services/indexor/github';
import { GithubRepository } from '../../../../src/server/api/repository/github';
import { getServerAuthSession } from '../../../../src/server/auth';
import { Repository } from '../../../../packages/ui/src/types/branch';

const openai = new OpenAI();

const requestBodySchema = z.object({
	id: z.string(),
	parentId: z.string(),
	oldValue: z.array(attributeSchema),
	newValue: z.array(attributeSchema),
	repositoryId: z.string()
})
type RequestBody = z.infer<typeof requestBodySchema>;

const payload = {include: {definition: true}}
type ComponentElementPrisma = Prisma.ComponentElementGetPayload<typeof payload>

export async function POST(req: Request, {params}: {params: {branchId: string}}): Promise<Response> {
	const {branchId} = params;

	const branch = await prisma.branch.findUnique({
		where: {
			id: branchId
		}
	});
	if (branch === null) {
		throw new Error("Cannot find branch with id " + branchId);
	}
	const body = requestBodySchema.parse(await req.json());
	
	const elementInstances = await prisma.componentElement.findMany({
		where: {
			repository_id: body.repositoryId 
		},
		include: {
			definition: true
		}
	});
	const repository = await prisma.repository.findUnique({
		where: {
			id: body.repositoryId
		}
	});

	if (repository === null) {
		return new Response(null, {
			status: 400
		})
	}
	
	const githubRepository = new GithubRepository(repository);

	const {location, updatedText} = await getChangeAndLocation(body, githubRepository, elementInstances);

	
	await githubRepository.updateFileAndCommit(branch.name, location.file, updatedText, location.start, location.end);

	return new Response(JSON.stringify({}), {
		status: 200,
	})
}

async function getChangeAndLocation(body: RequestBody, githubRepository: GithubRepository, elementInstances: ComponentElementPrisma[]) {
	const possibleComponents: ComponentLocation[] = [];
	const component = elementInstances.find(el => el.id === body.id);
	const parentComponent = elementInstances.find(el => el.id === body.parentId);

	if (component === undefined ) {
		throw new Error('Cannot find component with id ' + body.id);
	}
	if (parentComponent === undefined ) {
		throw new Error('Cannot find component with id ' + body.parentId);
	}

	const containingComponent = component.definition;
	
	possibleComponents.push(...[containingComponent, parentComponent].map(el => ({file: el.file, start: el.start, end: el.end})));
	
	//const elementSnippet = getCodeSnippet(component.location);
	const possibleComponentsSnippets = await Promise.all(possibleComponents.map((location) => getCodeSnippet(githubRepository)(location)));

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
		if (newSnippet === referencedSnippet) {
			throw new Error("Invalid response from openai. Can't update code snippet");
		}
		return {location: referencedComponent, updatedText: newSnippet};
	} else {
		throw new Error('Invalid response from openai');
	}
}