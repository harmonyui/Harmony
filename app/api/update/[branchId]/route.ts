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
//import {ComponentElement as ComponentElementPrisma, Prisma} from '@prisma/client';

const openai = new OpenAI();

const requestBodySchema = z.object({
	id: z.string(),
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
	if (component === undefined) {
		throw new Error('Cannot find component with id ' + body.id);
	}
	const containingComponent = component.definition;
	
	possibleComponents.push({file: containingComponent.file, start: containingComponent.start, end: containingComponent.end});
	possibleComponents.push(...elementInstances.filter(el => el.name === containingComponent.name).map(el => ({file: el.file, start: el.start, end: el.end})));
	
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
		return {location: referencedComponent, updatedText: newSnippet};
	} else {
		throw new Error('Invalid response from openai');
	}
}

//start: 64, 2454
/*
"function Home() {\r\n  return (\r\n    <main className=\"flex min-h-screen flex-col items-center justify-between p-24\">\r\n      <div className=\"z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex\">\r\n        <p className=\"fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30\">\r\n          Get started by editing&nbsp;\r\n          <code className=\"font-mono font-bold\">app/index.tsx</code>\r\n        </p>\r\n        <div className=\"fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none\">\r\n          <a\r\n            className=\"pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0\"\r\n            href=\"https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app\"\r\n            target=\"_blank\"\r\n            rel=\"noopener noreferrer\"\r\n          >\r\n            By{' '}\r\n            <Image\r\n              src=\"/vercel.svg\"\r\n              alt=\"Vercel Logo\"\r\n              className=\"dark:invert\"\r\n              width={100}\r\n              height={24}\r\n              priority\r\n            />\r\n          </a>\r\n        </div>\r\n      </div>\r\n\r\n      <div className=\"relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]\">\r\n        <Image\r\n          className=\"relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert\"\r\n          src=\"/next.svg\"\r\n          alt=\"Next.js Logo\"\r\n          width={180}\r\n          height={37}\r\n          priority\r\n        />\r\n      </div>\r\n\r\n      <LinkSection/>\r\n    </main>\r\n  )\r\n}"
*/