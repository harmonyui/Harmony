/* eslint-disable @typescript-eslint/no-unnecessary-condition -- ok*/

/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok*/
/* eslint-disable no-await-in-loop -- ok*/
import type { ComponentLocation, ComponentUpdate, HarmonyComponentInfo } from "@harmony/util/src/types/component";
import { loadRequestSchema, loadResponseSchema, publishRequestSchema, updateRequestBodySchema } from '@harmony/util/src/types/network';
import type { PublishResponse, UpdateResponse } from '@harmony/util/src/types/network';
import { getLocationsFromComponentId, reverseUpdates, translateUpdatesToCss } from "@harmony/util/src/utils/component";
import { camelToKebab, round } from "@harmony/util/src/utils/common";
import type { BranchItem, Repository } from "@harmony/util/src/types/branch";
import { TailwindConverter } from 'css-to-tailwindcss';
import { mergeClassesWithScreenSize } from "@harmony/util/src/utils/tailwind-merge";
import { DEFAULT_WIDTH, INDEXING_VERSION } from "@harmony/util/src/constants";
import { convertToHarmonyInfo, indexFiles, updateDatabaseComponentDefinitions, updateDatabaseComponentErrors } from "../services/indexor/indexor";
import { getCodeSnippet, getFileContent } from "../services/indexor/github";
import { updateComponentIdsFromUpdates } from "../services/updator/local";
import { createTRPCRouter, publicProcedure } from "../trpc";
import type { GitRepository } from "../repository/github";
import type { Attribute, HarmonyComponent } from "../services/indexor/types";
import { createPullRequest } from "./pull-request";
import { getBranch, getRepository } from "./branch";

export const editorRouter = createTRPCRouter({
	loadProject: publicProcedure
		.input(loadRequestSchema)
		.output(loadResponseSchema)
		.query(async ({ ctx, input }) => {
			const { repositoryId, branchId } = input;
			const { prisma } = ctx;

			const repository = await getRepository({ prisma, repositoryId });
			if (!repository) throw new Error("No repo");

			const pullRequest = await prisma.pullRequest.findUnique({
				where: {
					branch_id: branchId
				}
			});

			const accountTiedToBranch = await prisma.account.findFirst({
				where: {
					branch: {
						some: {
							id: branchId
						}
					}
				}
			});

			if (!accountTiedToBranch) {
				throw new Error(`Cannot find account tied to branch ${branchId}`);
			}

			let updates: ComponentUpdate[] = [];

			const query = await prisma.$queryRaw<{ action: string, type: string, childIndex: number, name: string, value: string, oldValue: string, id: string, parentId: string, isGlobal: boolean }[]>`
                SELECT u.action, u.type, u.name, u."childIndex", u.value, u.old_value as "oldValue", u.is_global as "isGlobal", e.id, e.parent_id as "parentId" FROM "ComponentUpdate" u
                INNER JOIN "ComponentElement" e on e.id = component_id
                WHERE u.branch_id = ${branchId}
                ORDER BY u.date_modified ASC`


			updates = query.map(up => ({
				action: up.action as ComponentUpdate['action'],
				type: up.type as ComponentUpdate['type'],
				name: up.name,
				value: up.value,
				oldValue: up.oldValue,
				componentId: up.id,
				parentId: up.parentId,
				childIndex: up.childIndex,
				isGlobal: up.isGlobal
			}));

			const githubRepository = ctx.gitRepositoryFactory.createGitRepository(repository);
			const ref = await githubRepository.getBranchRef(repository.branch);

			//If the current repository ref is out of date, that means we have some
			//new commits that might affect our previously indexed component elements.
			//Let's go through the diffs and update those component ids
			if (ref !== repository.ref) {
				await updateComponentIdsFromUpdates(updates, repository.ref, githubRepository);

				await prisma.repository.update({
					where: {
						id: repository.id,
					},
					data: {
						ref
					}
				})
			}

			const branches = await prisma.branch.findMany({
				where: {
					repository_id: repositoryId
				}
			});

			const errorElements = await prisma.componentError.findMany({
				where: {
					repository_id: repositoryId
				}
			})

			const isDemo = accountTiedToBranch.role === 'quick';

			const indexedComponents = await indexForComponents(updates.map(update => update.componentId), githubRepository);
			const harmonyComponents: HarmonyComponentInfo[] = convertToHarmonyInfo(indexedComponents);

			return {
				updates,
				branches: branches.map(branch => ({
					id: branch.id,
					name: branch.label
				})),
				errorElements: isDemo ? [] : errorElements.map(element => ({ componentId: element.component_id, type: element.type })),
				pullRequest: pullRequest || undefined,
				showWelcomeScreen: isDemo && !accountTiedToBranch.seen_welcome_screen,
				isDemo,
				harmonyComponents
			}
		}),
	saveProject: publicProcedure
		.input(updateRequestBodySchema)
		.mutation(async ({ ctx, input }) => {
			const { branchId } = input;
			const body = input;
			const { prisma } = ctx;

			const branch = await prisma.branch.findUnique({
				where: {
					id: branchId
				}
			});
			if (branch === null) {
				throw new Error(`Cannot find branch with id ${branchId}`);
			}

			const pullRequest = await prisma.pullRequest.findUnique({
				where: {
					branch_id: branchId
				}
			})

			if (pullRequest) {
				throw new Error("Cannot make changes on a published branch");
			}

			const repository = await getRepository({ prisma, repositoryId: branch.repository_id });
			if (!repository) {
				throw new Error(`Cannot find repository with id ${branch.repository_id}`)
			}

			const accountTiedToBranch = await prisma.account.findFirst({
				where: {
					branch: {
						some: {
							id: branchId
						}
					}
				}
			});

			if (!accountTiedToBranch) {
				throw new Error(`Cannot find account tied to branch ${branchId}`);
			}

			await prisma.account.update({
				where: {
					id: accountTiedToBranch.id
				},
				data: {
					seen_welcome_screen: true
				}
			})

			const gitRepository = ctx.gitRepositoryFactory.createGitRepository(repository);
			const updates: ComponentUpdate[] = [];
			const errorUpdates: (ComponentUpdate & { errorType: string })[] = [];
			//Indexes the files of these component updates
			for (const value of body.values) {
				for (const update of value.update) {
					if (!update.componentId) continue;

					//TODO: Be able to handle dynamic components so we don't have to do this
					const split = update.componentId.split('#')
					if (split.length > 1 && /pages\/_app\.(tsx|jsx|js)/.exec(atob(split[0]))) {
						update.componentId = split.slice(1).join('#');
					}

					let element = await prisma.componentElement.findFirst({
						where: {
							id: update.componentId,
							repository_id: branch.repository_id,
							version: INDEXING_VERSION
						}
					}) ?? undefined;
					if (!element) {
						const elementInstances = await indexForComponent(update.componentId, gitRepository);
						const indexedElement = elementInstances.find(el => el.id === update.componentId);
						if (indexedElement) {
							await updateDatabaseComponentDefinitions(elementInstances, branch.repository_id);
							await updateDatabaseComponentErrors(elementInstances, branch.repository_id);
							element = await ctx.harmonyComponentRepository.createOrUpdateElement(indexedElement, branch.repository_id);
						}
					}

					const error = await prisma.componentError.findFirst({
						where: {
							component_id: element?.id,
							repository_id: branch.repository_id,
							type: update.type
						}
					});


					if (element && !error) {
						updates.push(update);
					} else if (!element) {
						throw new Error("Cannot have an error element because that shouldn't happened anymore");
					} else if (error) {
						errorUpdates.push({ ...update, errorType: error.type });
					}
				}
			}

			await Promise.all(updates.map(up => prisma.componentUpdate.create({
				data: {
					component_id: up.componentId,
					action: up.action,
					type: up.type,
					name: up.name,
					value: up.value,
					branch_id: branchId,
					old_value: up.oldValue,
					childIndex: up.childIndex,
					is_global: up.isGlobal
				}
			})))

			const reversed = reverseUpdates(errorUpdates);
			const response: UpdateResponse = { errorUpdates: reversed };
			return response;
		}),
	publishProject: publicProcedure
		.input(publishRequestSchema)
		.mutation(async ({ ctx, input }) => {
			const data = input;
			const { branchId, pullRequest } = data;
			const { prisma } = ctx;

			const branch = await getBranch({ prisma, branchId });
			if (!branch) {
				throw new Error(`Cannot find branch with id ${branchId}`);
			}

			const repository = await getRepository({ prisma, repositoryId: branch.repositoryId });
			if (!repository) {
				throw new Error(`Cannot find repository with id ${branch.repositoryId}`);
			}

			const alreadyPublished = await prisma.pullRequest.findUnique({
				where: {
					branch_id: branch.id
				}
			})

			if (alreadyPublished) {
				throw new Error("This project has already been published");
			}

			const old: string[] = branch.old;
			//Get rid of same type of updates (more recent one wins)
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- It is necessary
			const updates = branch.updates.reduce<(ComponentUpdate)[]>((prev, curr, i) => prev.find(p => p.type === curr.type && p.name === curr.name && p.componentId === curr.componentId) ? prev : prev.concat([{ ...curr, oldValue: old[i]! }]), []);

			const gitRepository = ctx.gitRepositoryFactory.createGitRepository(repository);
			await findAndCommitUpdates(updates, gitRepository, branch);

			const newPullRequest = await createPullRequest({ branch, pullRequest, gitRepository })
			const response: PublishResponse = { pullRequest: newPullRequest };

			return response;
		})
})

async function indexForComponent(componentId: string, gitRepository: GitRepository): Promise<HarmonyComponent[]> {
	const readFile = async (filepath: string) => {
		//TOOD: Need to deal with actual branch probably at some point
		const content = //await getFile(`/Users/braydonjones/Documents/Projects/formbricks/${filepath}`);
			await getFileContent(gitRepository, filepath, gitRepository.repository.branch);

		return content;
	}

	//TODO: This does not follow the file up the whole tree which means it does not know
	// all of the possible locations an attribute can be saved. Find a better way to do this
	const locations = getLocationsFromComponentId(componentId);
	const paths = locations.map(location => location.file);
	const result = await indexFiles(paths, readFile);
	if (!result) return [];

	return result.elementInstance;
}

async function indexForComponents(componentIds: string[], gitRepository: GitRepository): Promise<HarmonyComponent[]> {
	const readFile = async (filepath: string) => {
		//TOOD: Need to deal with actual branch probably at some point
		const content = //await getFile(`/Users/braydonjones/Documents/Projects/formbricks/${filepath}`);
			await getFileContent(gitRepository, filepath, gitRepository.repository.branch);

		return content;
	}

	//TODO: This does not follow the file up the whole tree which means it does not know
	// all of the possible locations an attribute can be saved. Find a better way to do this
	const locations = componentIds.flatMap(componentId => getLocationsFromComponentId(componentId));
	const paths = locations.map(location => location.file);
	const result = await indexFiles(paths, readFile);
	if (!result) return [];

	return result.elementInstance;
}

interface FileUpdate { update: ComponentUpdate, dbLocation: ComponentLocation, location: (ComponentLocation & { updatedTo: number }), updatedCode: string, attribute?: Attribute };
interface UpdateInfo {
	component: HarmonyComponent,
	attributes: Attribute[],
	update: ComponentUpdate,
	type: ComponentUpdate['type'],
	oldValue: string,
	value: string,
	font?: string
}

async function createGithubBranch(gitRepository: GitRepository, branchName: string): Promise<void> {
	await gitRepository.createBranch(branchName);
}

async function findAndCommitUpdates(updates: ComponentUpdate[], gitRepository: GitRepository, branch: BranchItem) {
	const repository = gitRepository.repository;

	let fileUpdates: FileUpdate[] = [];

	const elementInstances = await indexForComponents(updates.map(update => update.componentId), gitRepository);

	//TODO: old value is not updated properly for size and spacing
	const updatesTranslated = translateUpdatesToCss(updates);

	const updateInfo = await updatesTranslated.reduce<Promise<UpdateInfo[]>>(async (prevPromise, curr) => {
		const prev = await prevPromise;
		if (curr.type === 'className') {
			if (curr.name !== 'font') {
				const cssName = camelToKebab(curr.name);

				//Round the pixel values
				const match = /^(-?\d+(?:\.\d+)?)(\D*)$/.exec(curr.value);
				if (match) {
					const value = parseFloat(match[1] || '0');
					const unit = match[2];
					curr.value = `${round(value)}${unit}`;
				}
				curr.value = `${cssName}:${curr.value};`
				curr.oldValue = `${camelToKebab(curr.name)}:${curr.oldValue}`;
			}
		}
		const classNameUpdate = curr.type === 'className' ? prev.find(({ update: up }) => up.componentId === curr.componentId && up.type === 'className') : undefined;
		if (classNameUpdate) {
			if (curr.name !== 'font') {
				classNameUpdate.value += curr.value;
				classNameUpdate.oldValue += curr.oldValue;
			} else {
				classNameUpdate.font = curr.value;
			}
		} else {
			const getComponent = (currId: string): Promise<HarmonyComponent | undefined> => {
				const currElement = elementInstances.find(instance => instance.id === currId);

				return Promise.resolve(currElement);
			}
			const getAttributes = (component: HarmonyComponent): Promise<Attribute[]> => {
				const allAttributes = component.props;

				//Sort the attributes according to layers with the bottom layer first for global
				allAttributes.sort((a, b) => b.reference.id.split('#').length - a.reference.id.split('#').length);


				const attributes: Attribute[] = [];

				//If this is global, find the first string attribute and get everything on that layer
				for (const attribute of allAttributes) {
					if (attribute.type === 'className' && attribute.name === 'string' && curr.isGlobal) {
						attributes.push(...allAttributes.filter(attr => attr.reference.id === attribute.reference.id && attr.type === 'className'));
					}

					//Continue adding attributes for non-global or global's that don't already have classNames
					if (!curr.isGlobal || attribute.type !== 'className' && !attributes.find(attr => attr.type === 'className' && attr.name === 'string')) {
						attributes.push(attribute);
					}
				}

				//Put the parents first for updating the code
				return Promise.resolve(attributes.sort((a, b) => a.reference.id.split('#').length - b.reference.id.split('#').length));
			}
			//We update the parent when we have multiple of the same elements with different updates or the user has specified that it is not a global update
			const component = await getComponent(curr.componentId);
			if (!component) {
				return prev;
				//throw new Error('Cannot find component with id ' + curr.componentId);
			}
			const attributes = await getAttributes(component);
			const font = curr.type === 'className' && curr.name === 'font' ? curr.value : undefined;
			const value = curr.type === 'className' && curr.name === 'font' ? '' : curr.value;

			const sameComponent = curr.type === 'className' ? prev.find(({ component: other, type }) => type === 'className' && other.id === component.id && other.getParent()?.id === component.getParent()?.id) : undefined;
			if (sameComponent) {
				if (curr.name !== 'font') {
					sameComponent.value += curr.value;
					sameComponent.oldValue += curr.oldValue;
				} else {
					sameComponent.font = curr.value;
				}
			} else {
				prev.push({ update: curr, component, oldValue: curr.oldValue, value, type: curr.type, font, attributes });
			}
		}
		return prev;
	}, Promise.resolve([]));

	for (const info of updateInfo) {
		//TODO: Right now we are creating the branch right before updating which means we need to use 'master' branch here.
		// in the future we probably will use the actual branch
		const results = await getChangeAndLocation(info, repository, gitRepository, repository.branch);

		fileUpdates.push(...results);
	}

	fileUpdates = fileUpdates.sort((a, b) => a.location.start - b.location.start);

	const commitChanges: Record<string, { filePath: string, locations: { snippet: string, start: number, end: number, updatedTo: number, diff: number }[] }> = {};
	for (const update of fileUpdates) {
		let change = commitChanges[update.location.file];
		if (!change) {
			change = { filePath: update.location.file, locations: [] }
			commitChanges[update.location.file] = change;
		}
		const newLocation = { snippet: update.updatedCode, start: update.location.start, end: update.location.end, updatedTo: update.location.updatedTo, diff: 0 };
		const last = change.locations[change.locations.length - 1];
		if (last) {
			const diff = last.updatedTo - last.end + last.diff;
			if (last.updatedTo > newLocation.start + diff) {
				if (last.snippet === newLocation.snippet) continue;
				//throw new Error("Conflict in changes")
				console.log(`Conflict?: ${last.end}, ${newLocation.start + diff}`);
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

	await createGithubBranch(gitRepository, branch.name);
	await gitRepository.updateFilesAndCommit(branch.name, Object.values(commitChanges));
}

async function getChangeAndLocation(update: UpdateInfo, repository: Repository, gitRepository: GitRepository, branchName: string): Promise<FileUpdate[]> {
	const { component, type, oldValue: _oldValue, attributes } = update;
	// const component = elementInstances.find(el => el.id === id && el.parent_id === parentId);

	// if (component === undefined ) {
	// 	throw new Error('Cannot find component with id ' + id);
	// }
	// const parent = elementInstances.find(el => el.id === component.parent_id);

	// const attributes = await prisma.componentAttribute.findMany({
	// 	where: {
	// 		component_id: component.id,
	// 	},
	// 	...attributePayload
	// });

	interface LocationValue {
		location: ComponentLocation,
		value: string | undefined,
		isDefinedAndDynamic: boolean
	}
	const getLocationAndValue = (attribute: Attribute | undefined, _component: HarmonyComponent): LocationValue => {
		const isDefinedAndDynamic = attribute?.name === 'property';
		return { location: attribute?.location || _component.location, value: attribute?.name === 'string' ? attribute.value : undefined, isDefinedAndDynamic };
	}

	const results: FileUpdate[] = [];

	const addCommentToJSXElement = async ({ location, commentValue, attribute }: { location: ComponentLocation, commentValue: string, attribute: Attribute | undefined }): Promise<FileUpdate> => {
		const code = await getCodeSnippet(gitRepository)(component.location, branchName);
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
		return { location: { file: location.file, start: location.start + start, end: location.start + end, updatedTo: location.start + updatedTo }, updatedCode: value, update: update.update, dbLocation: location, attribute };
	}

	interface AddClassName {
		location: ComponentLocation,
		code: string,
		newClass: string,
		oldClass: string | undefined,
		commentValue: string,
		attribute: Attribute | undefined,
		isDefinedAndDynamic: boolean;
	}
	//This is when we do not have the className data (either className does not exist on a tag or it is dynamic)
	const addNewClassOrComment = async ({ location, code, newClass, oldClass, commentValue, attribute }: AddClassName): Promise<FileUpdate> => {
		if (oldClass === undefined) {
			return addCommentToJSXElement({ location, commentValue, attribute });
		} else if (attribute?.locationType === 'add') {
			// eslint-disable-next-line no-param-reassign -- It is ok
			newClass = ` className="${newClass}"`;
			// eslint-disable-next-line no-param-reassign -- It is ok
			oldClass = '';
		}

		const oldValue = oldClass;
		const start = code.indexOf(oldValue);
		const end = oldValue.length + start;
		const updatedTo = newClass.length + start;
		if (start < 0) {
			throw new Error(`There was no update for tailwind classes, snippet: ${code}, oldValue: ${oldValue}`);
		}

		return { location: { file: location.file, start: location.start + start, end: location.start + end, updatedTo: location.start + updatedTo }, updatedCode: newClass, update: update.update, dbLocation: location, attribute };
	}

	switch (type) {
		case 'text':
			{
				const textAttributes = attributes.filter(attr => attr.type === 'text');
				const index = parseInt(update.update.name);
				const textAttribute = textAttributes.find(attr => attr.index === index);
				const { location, value } = getLocationAndValue(textAttribute, component);

				const elementSnippet = await getCodeSnippet(gitRepository)(location, branchName);
				const oldValue = value || _oldValue;
				const start = elementSnippet.indexOf(oldValue);
				const end = oldValue.length + start;
				const updatedTo = update.value.length + start;
				if (start < 0) {
					const commentValue = `Change inner text for ${component.name} tag from ${oldValue} to ${update.value}`;
					results.push(await addCommentToJSXElement({ location, attribute: textAttribute, commentValue }))
				} else {
					results.push({ location: { file: location.file, start: location.start + start, end: location.start + end, updatedTo: location.start + updatedTo }, updatedCode: update.value, update: update.update, dbLocation: location, attribute: textAttribute });
				}
			}
			break;
		case 'className':
			{
				const classNameAttributes = attributes.filter(attr => attr.type === 'className');

				if (repository.cssFramework === 'tailwind') {
					//This assumes that the update values have already been merged and converted to name:value pairs
					const converted = await converter.convertCSS(`.example {
						${update.value}
					}`);
					const newClasses = converted.nodes.reduce((prev, curr) => prev + curr.tailwindClasses.join(' '), '')

					type AttributeUpdate = AddClassName;
					const attributeUpdates: AttributeUpdate[] = [];

					const getAttribute = async (attribute: Attribute | undefined, getNewValueAndComment: (oldValue: string | undefined, location: ComponentLocation) => { newClass: string, commentValue: string, oldClass: string | undefined }): Promise<{ attribute: AttributeUpdate, oldClass: string | undefined }> => {
						const locationAndValue = getLocationAndValue(attribute, component);
						//TODO: This is temporary. It shouldn't have 'className:'
						locationAndValue.value = locationAndValue.value?.replace('className:', '');
						const { location, value, isDefinedAndDynamic } = locationAndValue;
						const elementSnippet = await getCodeSnippet(gitRepository)(location, branchName);

						//TODO: Make the tailwind prefix part dynamic
						const oldClasses = repository.tailwindPrefix ? value?.replaceAll(repository.tailwindPrefix, '') : value;
						const { newClass, commentValue, oldClass } = getNewValueAndComment(oldClasses, location);

						return {
							attribute: { location, code: elementSnippet, oldClass: value, newClass, isDefinedAndDynamic, commentValue, attribute },
							oldClass
						};
					}

					const getAttributeFromClass = async (attribute: Attribute | undefined, _newClass: string): Promise<{ attribute: AttributeUpdate, oldClass: string | undefined }> => {
						return getAttribute(attribute, (oldClasses, location) => {
							//If we have already merged classes, then merge out new stuff into what was already merged
							const oldStuff = attributeUpdates.find(attr => attr.location === location)?.newClass ?? oldClasses;
							const mergedIt = mergeClassesWithScreenSize(oldStuff, _newClass, DEFAULT_WIDTH)
							const newClass = repository.tailwindPrefix ? addPrefixToClassName(mergedIt, repository.tailwindPrefix) : mergedIt;
							const commentValue = repository.tailwindPrefix ? addPrefixToClassName(newClasses, repository.tailwindPrefix) : newClasses;

							return { newClass, oldClass: oldStuff, commentValue };
						});
					}

					const addAttribute = (attribute: AttributeUpdate): void => {
						const sameAttributeLocation = attributeUpdates.find(attr => attr.location === attribute.location);
						if (sameAttributeLocation) {
							sameAttributeLocation.newClass = attribute.newClass;
							return;
						}

						attributeUpdates.push(attribute);
					}

					const defaultClassName = classNameAttributes.find(attr => attr.name === 'string') || classNameAttributes[0] as Attribute | undefined;
					for (const newClass of newClasses.split(' ')) {
						let addedAttribute = false;
						for (const classNameAttribute of classNameAttributes) {
							if (classNameAttribute.name !== 'string') continue;
							const { attribute, oldClass } = await getAttributeFromClass(classNameAttribute, newClass);
							if (oldClass && attribute.newClass.split(' ').length === oldClass.split(' ').length) {
								addAttribute(attribute);
								addedAttribute = true;
								break;
							}
						}
						if (!addedAttribute) {
							addAttribute((await getAttributeFromClass(defaultClassName, newClass)).attribute);
						}
					}

					if (update.font) {
						const sameAttributeLocation = attributeUpdates.find(attr => attr.location === defaultClassName?.location);
						if (sameAttributeLocation) {
							sameAttributeLocation.newClass += ` ${update.font}`;
						} else {
							attributeUpdates.push((await getAttribute(defaultClassName, (oldClasses) => {
								const value = oldClasses ? `${oldClasses} ${update.font}` : update.font || '';

								return {
									newClass: value,
									commentValue: update.font || '',
									oldClass: oldClasses
								}
							})).attribute);
						}
					}

					results.push(...await Promise.all(attributeUpdates.map(attribute => addNewClassOrComment(attribute))));

					//TODO: Make the tailwind prefix part dynamic
					// const oldClasses = repository.tailwindPrefix ? value?.replaceAll(repository.tailwindPrefix, '') : value;

					// const mergedIt = mergeClassesWithScreenSize(oldClasses, newClasses, DEFAULT_WIDTH);
					// let mergedClasses = repository.tailwindPrefix ? addPrefixToClassName(mergedIt, repository.tailwindPrefix) : mergedIt;

					// let withPrefix = repository.tailwindPrefix ? addPrefixToClassName(newClasses, repository.tailwindPrefix) : newClasses;
					// mergedClasses = update.font ? `${update.font} ${mergedClasses}` : mergedClasses;
					// withPrefix = update.font ? `${update.font} ${withPrefix}` : withPrefix;

					// result = addNewClassOrComment({location, code: elementSnippet, newClass: mergedClasses, oldClass: value, commentValue: withPrefix, attribute: classNameAttribute, isDefinedAndDynamic});
				} else {
					const locationAndValue = getLocationAndValue(classNameAttributes[0], component);
					//TODO: This is temporary. It shouldn't have 'className:'
					locationAndValue.value = locationAndValue.value?.replace('className:', '');
					const { location } = locationAndValue;
					let valuesNewLined = update.value.replaceAll(';', ';\n');
					valuesNewLined = update.font ? `font className: ${update.value}\n\n${valuesNewLined}` : valuesNewLined;
					results.push(await addCommentToJSXElement({ location, commentValue: valuesNewLined, attribute: classNameAttributes[0] }));
				}
			}
			break;
		case 'component':
			break;
		default:
			throw new Error("Invalid use case");

	}

	return results;
}

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
	const listClass: [string, string][] = classes.map((classes) => {
		if (classes.includes(":")) {
			const [before, after] = classes.split(":");
			if (!before || !after) {
				throw new Error(`Invalid class ${classes}`);
			}
			return [`${before}:`, after];
		} else if (classes.startsWith('-')) {
			return ['-', classes.substring(1)];
		}
		return ['', classes];

	});

	const withPrefix: [string, string][] = listClass.map((classes) => {
		if (!classes.includes(prefix)) {
			return [classes[0], prefix + classes[1]];
		}
		return classes;

	});

	const final = withPrefix.map(str => `${str[0]}${str[1]}`).join(' ');

	return final;
}