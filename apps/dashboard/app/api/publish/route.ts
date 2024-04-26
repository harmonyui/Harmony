import { publishRequestSchema, PublishResponse } from "@harmony/ui/src/types/network";
import { prisma } from "../../../../../src/server/db";
import { createPullRequest } from "../../../../../src/server/api/routers/pull-request";
import { getBranch, getRepository } from "../../../../../src/server/api/routers/branch";
import { ComponentLocation, ComponentUpdate } from "@harmony/ui/src/types/component";
import { Branch, Prisma } from "@prisma/client";
import { GithubRepository } from "../../../../../src/server/api/repository/github";
import { getCodeSnippet } from "../../../../../src/server/api/services/indexor/github";
import { BranchItem, Repository } from "@harmony/ui/src/types/branch";
import { TailwindConverter } from 'css-to-tailwindcss';
import { twMerge } from 'tailwind-merge'
import { indexForComponent } from "../update/[branchId]/route";
import { translateUpdatesToCss } from "@harmony/util/src/component";
import { camelToKebab, round } from "@harmony/util/src";
import { mergeClassesWithScreenSize } from "@harmony/util/src/tailwind-merge";
import { DEFAULT_WIDTH } from "@harmony/util/src/constants";

const converter = new TailwindConverter({
	remInPx: 16, // set null if you don't want to convert rem to pixels
	//postCSSPlugins: [], // add any postcss plugins to this array
	tailwindConfig: {
	  // your tailwind config here
	  content: [],
	  theme: {
		extend: {
		}
	  },
	},
});

function addPrefixToClassName(className: string, prefix: string): string {
	const classes = className.split(' ');
	const list_class: [string, string][] = classes.map((classes) => {
		if (classes.includes(":")) {
			const [before, after] = classes.split(":");
			return [`${before}:`, after];
		} else if (classes.startsWith('-')) {
			return ['-', classes.substring(1)];
		} else {
			return ['', classes];
		}
	});

	const withPrefix: [string, string][] = list_class.map((classes) => {
		if (!classes.includes(prefix)) {
			return [classes[0], prefix + classes[1]];
		} else {
			return classes;
		}
	});

	const final = withPrefix.map(str => `${str[0]}${str[1]}`).join(' ');

	return final;
}

export const maxDuration = 300;
export async function POST(req: Request): Promise<Response> {
    const request = publishRequestSchema.safeParse(await req.json());
    if (!request.success) {
        return new Response(JSON.stringify("Invalid parameters"), {
            status: 400
        });
    }

    const data = request.data;
    const {branchId, pullRequest} = data;

	const branch = await getBranch({prisma, branchId});
	if (!branch) {
		throw new Error("Cannot find branch with id " + branchId);
	}

    const repository = await getRepository({prisma, repositoryId: branch.repositoryId});
    if (!repository) {
        throw new Error("Cannot find repository with id " + branch.repositoryId);
    }

	const alreadyPublished = await prisma.pullRequest.findUnique({
		where: {
			branch_id: branch.id
		}
	})

	if (Boolean(alreadyPublished)) {
		return new Response(JSON.stringify("This project has already been published"), {
			status: 400
		});
	}

	const old: string[] = branch.old;
    //Get rid of same type of updates (more recent one wins)
    const updates = branch.updates.reduce<(ComponentUpdate)[]>((prev, curr, i) => prev.find(p => p.type === curr.type && p.name === curr.name && p.componentId === curr.componentId && p.parentId === curr.parentId) ? prev : prev.concat([{...curr, oldValue: old[i]}]), []);
	// const githubRepository = new GithubRepository(repository);
	// const ref = await githubRepository.getBranchRef(repository.branch);
	// if (ref !== repository.ref) {
	// 	for (const update of updates) {
	// 		await indexForComponent(update.componentId, update.parentId, repository);
	// 	}

	// 	await prisma.repository.update({
	// 		where: {
	// 			id: repository.id
	// 		},
	// 		data: {
	// 			ref
	// 		}
	// 	})
	// }
	
    await findAndCommitUpdates(updates, repository, branch);

    const newPullRequest = await createPullRequest({branch, pullRequest, repository})
	const response: PublishResponse = {pullRequest: newPullRequest};
	
    return new Response(JSON.stringify(response), {
        status: 200
    })
}

const elementPayload = {
	include: {
		definition: {
			include: {
				location: true
			}
		}, 
		location: true,
		updates: true
	}
}
const attributePayload = {
	include: {
		location: true
	}
}
type ComponentElementPrisma = Prisma.ComponentElementGetPayload<typeof elementPayload>
type ComponentAttributePrisma = Prisma.ComponentAttributeGetPayload<typeof attributePayload>
type FileUpdate = {update: ComponentUpdate, dbLocation: ComponentLocation, location: (ComponentLocation & {updatedTo: number}), updatedCode: string, attribute?: ComponentAttributePrisma};
interface UpdateInfo {
	component: ComponentElementPrisma, 
	update: ComponentUpdate, 
	type: ComponentUpdate['type'], 
	oldValue: string, 
	value: string, 
	font?: string
}

async function createGithubBranch(repository: Repository, branchName: string): Promise<void> {
    const githubRepository = new GithubRepository(repository);
	await githubRepository.createBranch(branchName);
}

async function findAndCommitUpdates(updates: ComponentUpdate[], repository: Repository, branch: BranchItem) {
	const elementInstances = await prisma.componentElement.findMany({
		where: {
			repository_id: repository.id,
		},
		...elementPayload
	})
	
	const githubRepository = new GithubRepository(repository);
	let fileUpdates: FileUpdate[] = [];

	//TODO: old value is not updated properly for size and spacing
	updates = translateUpdatesToCss(updates) as ComponentUpdate[];

	const updateInfo = updates.reduce<UpdateInfo[]>((prev, curr) => {
		if (curr.type === 'className') {
			if (curr.name !== 'font') {
				const cssName = camelToKebab(curr.name);

				//Round the pixel values
				const match = /^(-?\d+(?:\.\d+)?)(\D*)$/.exec(curr.value);
				if (match) {
					const value = parseFloat(match[1]);
					const unit = match[2];
					curr.value = `${round(value)}${unit}`;
				}
				curr.value = `${cssName}:${curr.value};`
				curr.oldValue = `${camelToKebab(curr.name)}:${curr.oldValue}`;
			}
		}
		const classNameUpdate = curr.type === 'className' ? prev.find(({update: up}) => up.componentId === curr.componentId && up.parentId === curr.parentId && up.type === 'className') : undefined;
		if (classNameUpdate) {
			if (curr.name !== 'font') {
				classNameUpdate.value += curr.value;
				classNameUpdate.oldValue += curr.oldValue;
			} else {
				classNameUpdate.font = curr.value;
			}
		} else {
			const numSameComponentsButDifferentParents = updates.filter(update => update.componentId === curr.componentId && update.parentId !== curr.parentId).length;
			//We update the parent when we have multiple of the same elements with different updates or the user has specified that it is not a global update
			const shouldUpdateParent = numSameComponentsButDifferentParents > 0 || !curr.isGlobal;

			//When every we have a component that has a different parent, that means we need to set the classes at this parent
			// level not the component level
			const component = curr.type === 'className' && shouldUpdateParent ? elementInstances.find(el => el.id === curr.parentId) : elementInstances.find(el => el.id === curr.componentId && el.parent_id === curr.parentId);
			if (!component) {
				return prev;
				//throw new Error('Cannot find component with id ' + curr.componentId);
			}
			const font = curr.type === 'className' && curr.name === 'font' ? curr.value : undefined;
			const value = curr.type === 'className' && curr.name === 'font' ? '' : curr.value;

			const sameComponent = curr.type === 'className' ? prev.find(({component: other}) => other.id === component.id && other.parent_id === component.parent_id) : undefined;
			if (sameComponent) {
				if (curr.name !== 'font') {
					sameComponent.value += curr.value;
					sameComponent.oldValue += curr.oldValue;
				} else {
					sameComponent.font = curr.value;
				}
			} else {
				prev.push({update: curr, component, oldValue: curr.oldValue, value, type: curr.type, font});
			}
		}
		return prev;
	}, []);

	for (let i = 0; i < updateInfo.length; i++) {
        //TODO: Right now we are creating the branch right before updating which means we need to use 'master' branch here.
        // in the future we probably will use the actual branch
		const result = await getChangeAndLocation(updateInfo[i], repository, githubRepository, elementInstances, repository.branch);

        if (result)
		fileUpdates.push(result);
	}

	fileUpdates = fileUpdates.sort((a, b) => a.location.start - b.location.start);

	const commitChanges: Record<string, {filePath: string, locations: {snippet: string, start: number, end: number, updatedTo: number, diff: number}[]}> = {};
	for (const update of fileUpdates) {
		let change = commitChanges[update.location.file];
		if (!change) {
			change = {filePath: update.location.file, locations: []}
			commitChanges[update.location.file] = change;	
		}
		const newLocation = {snippet: update.updatedCode, start: update.location.start, end: update.location.end, updatedTo: update.location.updatedTo, diff: 0};
		const last = change.locations[change.locations.length - 1];
		if (last) {
			const diff = last.updatedTo - last.end + last.diff;
			if (last.updatedTo > newLocation.start + diff) {
				throw new Error("Conflict in changes")
				//console.log(`Conflict?: ${last.end}, ${newLocation.start + diff}`);
			}

			newLocation.start += diff;
			newLocation.end += diff;
			newLocation.updatedTo += diff;
			newLocation.diff = diff;
		}

		const diff = (newLocation.updatedTo - newLocation.end);

		const ends = fileUpdates.filter(f => f.dbLocation.end >= update.location.end);
		ends.forEach(end => {
			
			end.dbLocation.end += diff;
			if (end.dbLocation.start >= newLocation.start) {
				end.dbLocation.start += diff;
			}
		});

		change.locations.push(newLocation);
	}

    await createGithubBranch(repository, branch.name);
	await githubRepository.updateFilesAndCommit(branch.name, Object.values(commitChanges));
}

async function getChangeAndLocation(update: UpdateInfo, repository: Repository, githubRepository: GithubRepository, elementInstances: ComponentElementPrisma[], branchName: string): Promise<FileUpdate | undefined> {
	const {component, type, oldValue: _oldValue} = update;
	// const component = elementInstances.find(el => el.id === id && el.parent_id === parentId);
	
	// if (component === undefined ) {
	// 	throw new Error('Cannot find component with id ' + id);
	// }
	// const parent = elementInstances.find(el => el.id === component.parent_id);
	
	const attributes = await prisma.componentAttribute.findMany({
		where: {
			component_id: component.id,
			component_parent_id: component.parent_id,
		},
		...attributePayload
	});

	interface LocationValue {
		location: ComponentLocation,
		value: string | undefined,
		isDefinedAndDynamic: boolean
	}
	const getLocationAndValue = (attribute: ComponentAttributePrisma | undefined, component: ComponentElementPrisma): LocationValue => {
		const isDefinedAndDynamic = attribute?.name === 'property';
		return {location: attribute?.location || component.location, value: attribute?.name === 'string' ? attribute.value : undefined, isDefinedAndDynamic};
	}

	let result: FileUpdate | undefined;

	const addCommentToJSXElement = ({location, code, commentValue, attribute}: {location: ComponentLocation, code: string, commentValue: string, attribute: ComponentAttributePrisma | undefined}) => {
		const comment = `/** ${commentValue} */`;
		const match = /<([a-zA-Z0-9]+)(\s?)/.exec(code);
		if (!match) {
			throw new Error(`There was no update to add comment to jsx: snippet: ${code}, commentValue: ${commentValue}`);
		}

		//If there are no attributes in the tag, then add a space before the comment;
		const value = match[2] ? `${comment} ` : ` ${comment} `;
		//The start of the comment is right after the opening tag
		const matchEnd = match.index + match[0].length;
		const start = matchEnd;
		const end = start;
		const updatedTo = value.length + start;
		return {location: {file: location.file, start: location.start + start, end: location.start + end, updatedTo: location.start + updatedTo}, updatedCode: value, update: update.update, dbLocation: location, attribute};
	}

	interface AddClassName {
		location: ComponentLocation, 
		code: string, 
		newClass: string, 
		oldClass: string | undefined, 
		commentValue: string, 
		attribute: ComponentAttributePrisma | undefined,
		isDefinedAndDynamic: boolean;
	}
	//This is when we do not have the className data (either className does not exist on a tag or it is dynamic)
	const addNewClassOrComment = ({location, code, newClass, oldClass, commentValue, attribute, isDefinedAndDynamic}: AddClassName) => {
		if (oldClass === undefined) {
			//If this is a dynamic property then just add a comment
			if (isDefinedAndDynamic) {
				return addCommentToJSXElement({location, code, commentValue, attribute});
			}

			const match = /^<([a-zA-Z0-9]+)(\s?)/.exec(code);
			if (!match) {
				throw new Error(`There was no update to add className to jsx: snippet: ${code}, commentValue: ${commentValue}`);
			}

			//Here means we do not have a class 
			let value = match[2] ? `className="${newClass}" ` : ` className="${newClass}" `;
			value = value.replace('undefined ', '');
			oldClass = match[0];
			newClass = `${match[0]}${value}`;
		}

		const oldValue = oldClass;
		const start = code.indexOf(oldValue);
		const end = oldValue.length + start;
		const updatedTo = newClass.length + start;
		if (start < 0) {
			throw new Error(`There was no update for tailwind classes, snippet: ${code}, oldValue: ${oldValue}`);
		}
		
		return {location: {file: location.file, start: location.start + start, end: location.start + end, updatedTo: location.start + updatedTo}, updatedCode: newClass, update: update.update, dbLocation: location, attribute};
	}

	switch(type) {
		case 'text':
			{
				const textAttribute = attributes.find(attr => attr.type === 'text');
				const {location, value} = getLocationAndValue(textAttribute, component);
				
				const elementSnippet = await getCodeSnippet(githubRepository)(location, branchName);
				const oldValue = value || _oldValue;
				const start = elementSnippet.indexOf(oldValue);
				const end = oldValue.length + start;
				const updatedTo = update.value.length + start;
				if (start < 0) {
					const commentValue = `Change inner text for ${component.name} tag from ${oldValue} to ${update.value}`;
					result = addCommentToJSXElement({location, code: elementSnippet, attribute: textAttribute, commentValue})
				}
				
				result = {location: {file: location.file, start: location.start + start, end: location.start + end, updatedTo: location.start + updatedTo}, updatedCode: update.value, update: update.update, dbLocation: location, attribute: textAttribute};
			}
			break;
        case 'className':
			{
				const classNameAttribute = attributes.find(attr => attr.type === 'className');
				const locationAndValue = getLocationAndValue(classNameAttribute, component);
				//TODO: This is temporary. It shouldn't have 'className:'
				locationAndValue.value = locationAndValue.value?.replace('className:', '');
				const {location, value, isDefinedAndDynamic} = locationAndValue;
				
				const elementSnippet = await getCodeSnippet(githubRepository)(location, branchName);


				if (repository.cssFramework === 'tailwind') {
					//This assumes that the update values have already been merged and converted to name:value pairs
					const converted = await converter.convertCSS(`.example {
						${update.value}
					}`);
					const newClasses = converted.nodes.reduce((prev, curr) => prev + curr.tailwindClasses.join(' '), '')

					//TODO: Make the tailwind prefix part dynamic
					let oldClasses = repository.tailwindPrefix ? value?.replaceAll(repository.tailwindPrefix, '') : value;
					
					const mergedIt = mergeClassesWithScreenSize(oldClasses, newClasses, DEFAULT_WIDTH);
					let mergedClasses = repository.tailwindPrefix ? addPrefixToClassName(mergedIt, repository.tailwindPrefix) : mergedIt;

					let withPrefix = repository.tailwindPrefix ? addPrefixToClassName(newClasses, repository.tailwindPrefix) : newClasses;
					mergedClasses = update.font ? `${update.font} ${mergedClasses}` : mergedClasses;
					withPrefix = update.font ? `${update.font} ${withPrefix}` : withPrefix;
					
					result = addNewClassOrComment({location, code: elementSnippet, newClass: mergedClasses, oldClass: value, commentValue: withPrefix, attribute: classNameAttribute, isDefinedAndDynamic});
				} else {
					let valuesNewLined = update.value.replaceAll(';', ';\n');
					valuesNewLined = update.font ? `font className: ${update.value}\n\n${valuesNewLined}` : valuesNewLined;
					result = addCommentToJSXElement({location, commentValue: valuesNewLined, code: elementSnippet, attribute: classNameAttribute});
				}
			}
            break;
		default:
			throw new Error("Invalid use case");
			
	}

	return result;
}

/*
	font
		font-sans
		font-serif
		font-mono
		font-['arbitrary']
	font-size
		text-xs - font-size: 12px, line-height: 16px
		text-sm - font-size: 14px, line-height: 20px
		text-base - font-size: 16px, line-height: 24px
		text-lg - font-size: 18px, line-height: 28px
		text-xl - font-size: 20px, line-height: 28px
		text-2xl - font-size: 26px, line-height: 32px
		text-3xl - font-size: 32px, line-height: 36px
		text-4xl - font-size: 38px, line-height: 40px
		text-5xl - font-size: 48px, line-height: 1
		text-6xl - font-size: 60px, line-height: 1
		text-7xl - font-size: 72px, line-height: 1
		text-8xl - font-size: 96px, line-height: 1
		text-9xl - font-size: 128px, line-height: 1
	color
		text-['arbitrary']
	line-height
		leading-3	line-height: 12px
		leading-4	line-height: 16px
		leading-5	line-height: 20px
		leading-6	line-height: 24px
		leading-7	line-height: 28px
		leading-8	line-height: 32px
		leading-9	line-height: 36px
		leading-10	line-height: 40px
		leading-none	line-height: 1;
		leading-tight	line-height: 1.25;
		leading-snug	line-height: 1.375;
		leading-normal	line-height: 1.5;
		leading-relaxed	line-height: 1.625;
		leading-loose	line-height: 2;
	letter-spacing
		tracking-tighter	letter-spacing: -0.05em;
		tracking-tight	letter-spacing: -0.025em;
		tracking-normal	letter-spacing: 0em;
		tracking-wide	letter-spacing: 0.025em;
		tracking-wider	letter-spacing: 0.05em;
		tracking-widest	letter-spacing: 0.1em;
	text-align
		text-left	text-align: left;
		text-center	text-align: center;
		text-right	text-align: right;
		text-justify	text-align: justify;
		text-start	text-align: start;
		text-end	text-align: end;
	flex
		flex
	gap
		gap-0	gap: 0px;
		gap-px	gap: 1px;
		gap-0.5	gap: 2px
		gap-1	gap: 4px
		gap-1.5	gap: 6px
		gap-2	gap: 8px
		gap-2.5	gap: 10px
		gap-3	gap: 12px
		gap-3.5	gap: 14px
		gap-4	gap: 16px
		gap-5	gap: 20px
		gap-6	gap: 24px
		gap-7	gap: 28px
		gap-8	gap: 32px
		gap-9	gap: 36px
		gap-10	gap: 40px
		gap-11	gap: 44px
		gap-12	gap: 48px
		gap-14	gap: 56px
		gap-16	gap: 64px
		gap-20	gap: 80px
		gap-24	gap: 96px
		gap-28	gap: 112px
		gap-32	gap: 128px
		gap-36	gap: 144px
		gap-40	gap: 160px
		gap-44	gap: 176px
		gap-48	gap: 192px
		gap-52	gap: 208px
		gap-56	gap: 224px
		gap-60	gap: 240px
		gap-64	gap: 256px
		gap-72	gap: 288px
		gap-80	gap: 320px
		gap-96	gap: 384px
	justify-content
		justify-normal	justify-content: normal;
		justify-start	justify-content: flex-start;
		justify-end	justify-content: flex-end;
		justify-center	justify-content: center;
		justify-between	justify-content: space-between;
		justify-around	justify-content: space-around;
		justify-evenly	justify-content: space-evenly;
		justify-stretch	justify-content: stretch;
	align-items
		justify-items-start	justify-items: start;
		justify-items-end	justify-items: end;
		justify-items-center	justify-items: center;
		justify-items-stretch	justify-items: stretch;
	padding
		p-0 padding: 0px;
		p-px padding: 1px;
		p-0.5 padding: 2px;
		p-1 padding: 4px;
		p-1.5 padding: 6px;
		p-2 padding: 8px;
		p-2.5 padding: 10px;
		p-3 padding: 12px;
		p-3.5 padding: 14px;
		p-4 padding: 16px;
		p-5 padding: 20px;
		p-6 padding: 24px;
		p-7 padding: 28px;
		p-8 padding: 32px;
		p-9 padding: 36px;
		p-10 padding: 40px;
		p-11 padding: 44px;
		p-12 padding: 48px;
		p-14 padding: 56px;
		p-16 padding: 64px;
		p-20 padding: 80px;
		p-24 padding: 96px;
		p-28 padding: 112px;
		p-32 padding: 128px;
		p-36 padding: 144px;
		...
		p-96 padding: 384px;
	margin
*/