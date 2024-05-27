/* eslint-disable @typescript-eslint/no-unnecessary-condition -- ok*/
/* eslint-disable @typescript-eslint/no-shadow -- ok*/
/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok*/
/* eslint-disable no-await-in-loop -- ok*/
import type { ComponentElement, ComponentLocation, ComponentUpdate } from "@harmony/util/src/types/component";
import { loadRequestSchema, publishRequestSchema, PublishResponse, updateRequestBodySchema, UpdateResponse, type LoadResponse } from '@harmony/util/src/types/network';
import { createTRPCRouter, publicProcedure } from "../trpc";
import { updateComponentIdsFromUpdates } from "../services/updator/local";
import { getBranch, getRepository } from "./branch";
import { getCodeSnippet, getFileContent } from "../services/indexor/github";
import { getLocationsFromComponentId, reverseUpdates, translateUpdatesToCss } from "@harmony/util/src/utils/component";
import { indexFilesAndFollowImports } from "../services/indexor/indexor";
import { prisma, Prisma } from "@harmony/db/lib/prisma";
import { camelToKebab, round } from "@harmony/util/src/utils/common";
import { BranchItem, Repository } from "@harmony/util/src/types/branch";
import { TailwindConverter } from 'css-to-tailwindcss';
import { createPullRequest } from "./pull-request";
import { mergeClassesWithScreenSize } from "@harmony/util/src/utils/tailwind-merge";
import { DEFAULT_WIDTH, INDEXING_VERSION } from "@harmony/util/src/constants";
import { GitRepository } from "../repository/github";

export const editorRouter = createTRPCRouter({
    loadProject: publicProcedure
        .input(loadRequestSchema)
        .query(async ({ctx, input}) => {
            const {repositoryId, branchId} = input;
            const {prisma} = ctx;

            const repository = await getRepository({prisma, repositoryId});
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
                throw new Error(`Cannot find account tied to branch ${  branchId}`);
            }

            //await indexCodebase('/Users/braydonjones/Documents/Projects/formbricks', fromDir, repositoryId);

            let updates: ComponentUpdate[] = [];

            const query = await prisma.$queryRaw<{action: string, type: string, childIndex: number, name: string, value: string, oldValue: string, id: string, parentId: string, isGlobal: boolean}[]>`
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

			const isDemo = accountTiedToBranch.role === 'quick'

            return {
                updates,
                branches: branches.map(branch => ({
                    id: branch.id,
                    name: branch.label
                })),
                errorElements: isDemo ? [] : errorElements.map(element => ({componentId: element.component_id, type: element.type})),
                pullRequest: pullRequest || undefined,
                showWelcomeScreen: isDemo && !accountTiedToBranch.seen_welcome_screen,
                isDemo
            } satisfies LoadResponse
        }),
    saveProject: publicProcedure
        .input(updateRequestBodySchema)
        .mutation(async ({ctx, input}) => {
            const {branchId} = input;
            const body = input;
            const {prisma} = ctx;

            const branch = await prisma.branch.findUnique({
                where: {
                    id: branchId
                }
            });
            if (branch === null) {
                throw new Error("Cannot find branch with id " + branchId);
            }

            const pullRequest = await prisma.pullRequest.findUnique({
                where: {
                    branch_id: branchId
                }
            })

            if (pullRequest) {
                throw new Error("Cannot make changes on a published branch");
            }

            const repository = await getRepository({prisma, repositoryId: branch.repository_id});
            if (!repository) {
                throw new Error("Cannot find repository with id " + branch.repository_id)
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
                throw new Error("Cannot find account tied to branch " + branchId);
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
            const errorUpdates: (ComponentUpdate & {errorType: string})[] = [];
            //Indexes the files of these component updates
            for (const value of body.values) {
                for (const update of value.update) {
                //for (let i = 0; i < value.update.length; i++) {
                    //const update = value.update[i];
                    if (!update.componentId) continue;
                    
                    let element = await prisma.componentElement.findFirst({
                        where: {
                            id: update.componentId,
                            repository_id: branch.repository_id
                        }
                    });
                    if (!element) {
                        await indexForComponent(update.componentId, gitRepository);
                    }

                    element = await prisma.componentElement.findFirst({
                        where: {
                            id: update.componentId,
                            repository_id: branch.repository_id
                        }
                    });
                    let error: string | undefined = undefined;

                    //If the element was not created, or if this is text and it is not a static string 
                    //(i.e it is tied to a property or containing component) then this is an error that needs to be reverted
                    if (!element) {
                        error = 'element';
                    } else if (update.type === 'text') {
                        const textAttribute = await prisma.componentAttribute.findFirst({
                            where: {
                                component_id: update.componentId,
                                type: 'text',
                                name: 'string'
                            }
                        });
                        if (!textAttribute) {
                            error = 'text';
                        }
                    }
                    

                    if (!error) {
                        updates.push(update);
                    } else {
						if (error === 'element') {
							throw new Error("Cannot have an error element because that shouldn't happend anymore");
						}
                        const pastError = await prisma.componentError.findUnique({
                            where: {
                                component_id: update.componentId,
                                repository_id: branch.repository_id
                            }
                        });

                        if (!pastError) {
                            await prisma.componentError.create({
                                data: {
                                    component_id: update.componentId,
									repository_id: branch.repository_id,
                                    type: error
                                },
                            })
                        }
						errorUpdates.push({...update, errorType: error});
                    }
                }
            }

            for (const up of updates) {
                await prisma.componentUpdate.create({
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
                })
            }
            // await prisma.componentUpdate.createMany({
            // 	data: updates.map(up => ({
            // 		component_parent_id: up.parentId,
            // 		component_id: up.componentId,
            // 		action: up.action,
            // 		type: up.type,
            // 		name: up.name,
            // 		value: up.value,
            // 		branch_id: branchId,
            // 		old_value: up.oldValue
            // 	}))
            // });

            const reversed = reverseUpdates(errorUpdates);
            const response: UpdateResponse = {errorUpdates: reversed};
            return response;
        }),
	publishProject: publicProcedure
		.input(publishRequestSchema)
		.mutation(async ({ctx, input}) => {
			const data = input;
			const {branchId, pullRequest} = data;
			const {prisma} = ctx;

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

			if (alreadyPublished) {
				throw new Error("This project has already been published");
			}

			const old: string[] = branch.old;
			//Get rid of same type of updates (more recent one wins)
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- It is necessary
			const updates = branch.updates.reduce<(ComponentUpdate)[]>((prev, curr, i) => prev.find(p => p.type === curr.type && p.name === curr.name && p.componentId === curr.componentId) ? prev : prev.concat([{...curr, oldValue: old[i]!}]), []);
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

			const gitRepository = ctx.gitRepositoryFactory.createGitRepository(repository);
			await findAndCommitUpdates(updates, gitRepository, branch);

			const newPullRequest = await createPullRequest({branch, pullRequest, gitRepository})
			const response: PublishResponse = {pullRequest: newPullRequest};

			return response;
		})
})

async function indexForComponent(componentId: string, gitRepository: GitRepository): Promise<ComponentElement[]> {
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
	return indexFilesAndFollowImports(paths, readFile, gitRepository.repository.id)
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
		location: true,
	}
}
type ComponentElementPrisma = Prisma.ComponentElementGetPayload<typeof elementPayload>
type ComponentAttributePrisma = Prisma.ComponentAttributeGetPayload<typeof attributePayload>
interface FileUpdate {update: ComponentUpdate, dbLocation: ComponentLocation, location: (ComponentLocation & {updatedTo: number}), updatedCode: string, attribute?: ComponentAttributePrisma};
interface UpdateInfo {
	component: ComponentElementPrisma,
	attributes: ComponentAttributePrisma[], 
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
	let elementInstances = await prisma.componentElement.findMany({
		where: {
			repository_id: repository.id,
		},
		...elementPayload
	});
	elementInstances.sort((a, b) => b.id.split('#').length - a.id.split('#').length);

	const alreadyIndexed: string[] = [];
	let currIndex = elementInstances.find(i => i.version !== INDEXING_VERSION && !alreadyIndexed.includes(i.id));
	while (currIndex) {
		alreadyIndexed.push(...(await indexForComponent(currIndex.id, gitRepository)).map(el => el.id));
		alreadyIndexed.push(currIndex.id);
		currIndex = elementInstances.find(i => i.version !== INDEXING_VERSION && !alreadyIndexed.includes(i.id));
	}
	if (alreadyIndexed.length) {
		elementInstances = await prisma.componentElement.findMany({
			where: {
				repository_id: repository.id,
			},
			...elementPayload
		});
	}
	
	let fileUpdates: FileUpdate[] = [];

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
		const classNameUpdate = curr.type === 'className' ? prev.find(({update: up}) => up.componentId === curr.componentId && up.type === 'className') : undefined;
		if (classNameUpdate) {
			if (curr.name !== 'font') {
				classNameUpdate.value += curr.value;
				classNameUpdate.oldValue += curr.oldValue;
			} else {
				classNameUpdate.font = curr.value;
			}
		} else {
			const getComponent = (currId: string): ComponentElementPrisma | undefined => {
				const currElement = elementInstances.find(el => el.id === currId);
				if (!currElement) {
					return undefined;
				}
				return currElement;
				// if (curr.type !== 'className') return currElement;

				// const attributes = await prisma.componentAttribute.findMany({
				// 	where: {
				// 		component_id: currElement.id
				// 	}
				// });

				// const shouldUpdateParent = !curr.isGlobal && attributes.findIndex(attr => attr.type === 'className' && attr.name === 'property') > -1; //&& attr.value.split(':')[1] === 'className');
				// if (shouldUpdateParent) {
				// 	const parentId = curr.componentId.split('#').slice(0, curr.componentId.split('#').length - 1).join('#');
				// 	const el = await getComponent(parentId);
				// 	if (!el) {
				// 		return currElement;
				// 	}

				// 	return el;
				// }

				// return currElement;
			}
			const getAttributes = async (component: ComponentElementPrisma): Promise<ComponentAttributePrisma[]> => {
				const allAttributes = await prisma.componentAttribute.findMany({
					where: {
						component_id: component.id
					},
					...attributePayload
				});
				
				//Sort the attributes according to layers with the bottom layer first
				allAttributes.sort((a, b) => b.reference_component_id.split('#').length - a.reference_component_id.split('#').length);


				const attributes: ComponentAttributePrisma[] = [];

				//If this is global, find the first string attribute and get everything on that layer
				for (const attribute of allAttributes) {
					if (attribute.name === 'string' && curr.isGlobal) {
						attributes.push(...allAttributes.filter(attr => attr.reference_component_id === attribute.reference_component_id));
						break;
					}

					attributes.push(attribute);
				}

				return attributes;
			}
			//We update the parent when we have multiple of the same elements with different updates or the user has specified that it is not a global update
			const component = getComponent(curr.componentId);
			if (!component) {
				return prev;
				//throw new Error('Cannot find component with id ' + curr.componentId);
			}
			const attributes = await getAttributes(component);
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
				prev.push({update: curr, component, oldValue: curr.oldValue, value, type: curr.type, font, attributes});
			}
		}
		return prev;
	}, Promise.resolve([]));

	for (const info of updateInfo) {
	    //TODO: Right now we are creating the branch right before updating which means we need to use 'master' branch here.
        // in the future we probably will use the actual branch
		const results = await getChangeAndLocation(info, repository, gitRepository, elementInstances, repository.branch);

        fileUpdates.push(...results);
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

    await createGithubBranch(gitRepository, branch.name);
	await gitRepository.updateFilesAndCommit(branch.name, Object.values(commitChanges));
}

async function getChangeAndLocation(update: UpdateInfo, repository: Repository, gitRepository: GitRepository, elementInstances: ComponentElementPrisma[], branchName: string): Promise<FileUpdate[]> {
	const {component, type, oldValue: _oldValue, attributes} = update;
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
	const getLocationAndValue = (attribute: ComponentAttributePrisma | undefined, _component: ComponentElementPrisma): LocationValue => {
		const isDefinedAndDynamic = attribute?.name === 'property';
		return {location: attribute?.location || _component.location, value: attribute?.name === 'string' ? attribute.value : undefined, isDefinedAndDynamic};
	}

	const results: FileUpdate[] = [];

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
			// eslint-disable-next-line no-param-reassign -- It is ok
			oldClass = match[0];
			// eslint-disable-next-line no-param-reassign -- It is ok
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
				const textAttributes = attributes.filter(attr => attr.type === 'text');
				const index = parseInt(update.update.name);
				const textAttribute = textAttributes.find(attr => attr.index === index);
				const {location, value} = getLocationAndValue(textAttribute, component);
				
				const elementSnippet = await getCodeSnippet(gitRepository)(location, branchName);
				const oldValue = value || _oldValue;
				const start = elementSnippet.indexOf(oldValue);
				const end = oldValue.length + start;
				const updatedTo = update.value.length + start;
				if (start < 0) {
					const commentValue = `Change inner text for ${component.name} tag from ${oldValue} to ${update.value}`;
					results.push(addCommentToJSXElement({location, code: elementSnippet, attribute: textAttribute, commentValue}))
				} else {
					results.push({location: {file: location.file, start: location.start + start, end: location.start + end, updatedTo: location.start + updatedTo}, updatedCode: update.value, update: update.update, dbLocation: location, attribute: textAttribute});
				}
			}
			break;
        case 'className':
			{
				const classNameAttributes = attributes.filter(attr => attr.type === 'className');
				//const elementSnippet = await getCodeSnippet(gitRepository)(location, branchName);

				/*
				  1. <Button className="bg-blue-50"/>

				  2. <Button className={className}/>

				  3. <Button className={cn("bg-blue-50", className)} />

				  4. const variant = "bg-primary";
				     <Button className={cs("flex", variant)}/>

				  5. <JourneyCard buttonClass="bg-primary"/>
				  	 <Button className={cn("flex", buttonClass)}/>

				   
				 */

				if (repository.cssFramework === 'tailwind') {
					//This assumes that the update values have already been merged and converted to name:value pairs
					const converted = await converter.convertCSS(`.example {
						${update.value}
					}`);
					const newClasses = converted.nodes.reduce((prev, curr) => prev + curr.tailwindClasses.join(' '), '')

					type AttributeUpdate = AddClassName;
					const attributeUpdates: AttributeUpdate[] = [];

					const mergeClassesWithScreenSizeWithPrefix = (originalClass: string | undefined, newClass: string, screenSize: number, prefix: string | undefined) => {
						const merged = mergeClassesWithScreenSize(prefix ? originalClass?.replaceAll(prefix, '') : originalClass, prefix ? newClass.replaceAll(prefix, '') : newClass, screenSize);
						const withPrefix = prefix ? addPrefixToClassName(merged, prefix) : merged;

						return withPrefix;
					}

					const getAttribute = async (attribute: ComponentAttributePrisma, getNewValueAndComment: (oldValue: string | undefined) => {newClass: string, commentValue: string}): Promise<AttributeUpdate> => {
						const locationAndValue = getLocationAndValue(attribute, component);
						//TODO: This is temporary. It shouldn't have 'className:'
						locationAndValue.value = locationAndValue.value?.replace('className:', '');
						const {location, value, isDefinedAndDynamic} = locationAndValue; 
						const elementSnippet = await getCodeSnippet(gitRepository)(location, branchName);

						//TODO: Make the tailwind prefix part dynamic
						const oldClasses = repository.tailwindPrefix ? value?.replaceAll(repository.tailwindPrefix, '') : value;
						const {newClass, commentValue} = getNewValueAndComment(oldClasses);
						
						return {location, code: elementSnippet, oldClass: value, newClass, isDefinedAndDynamic, commentValue, attribute};
					}

					const getAttributeFromClass = async (attribute: ComponentAttributePrisma, _newClass: string): Promise<AttributeUpdate> => {
						return getAttribute(attribute, (oldClasses) => {
							const mergedIt = mergeClassesWithScreenSize(oldClasses, _newClass, DEFAULT_WIDTH)
							const newClass = repository.tailwindPrefix ? addPrefixToClassName(mergedIt, repository.tailwindPrefix) : mergedIt;
							const commentValue = repository.tailwindPrefix ? addPrefixToClassName(newClasses, repository.tailwindPrefix) : newClasses;
							
							return {newClass, commentValue};
						});
					}

					const addAttribute = (attribute: AttributeUpdate): void => {
						const sameAttributeLocation = attributeUpdates.find(attr => attr.location === attribute.location);
						if (sameAttributeLocation) {
							const newMerged = mergeClassesWithScreenSizeWithPrefix(sameAttributeLocation.newClass, attribute.newClass, DEFAULT_WIDTH, repository.tailwindPrefix);
							//const oldMerged = mergeClassesWithScreenSizeWithPrefix(sameAttributeLocation.oldClass, attribute.oldClass || '', DEFAULT_WIDTH, repository.tailwindPrefix);
							sameAttributeLocation.newClass = newMerged;
							//sameAttributeLocation.oldClass = oldMerged;
							return;
						}

						attributeUpdates.push(attribute);
					}

					const defaultClassName = classNameAttributes.find(attr => attr.name === 'string') || classNameAttributes[0];
					for (const newClass of newClasses.split(' ')) {
						let addedAttribue = false;
						for (const classNameAttribute of classNameAttributes) {
							if (classNameAttribute.name !== 'string') continue;
							const attribute = await getAttributeFromClass(classNameAttribute, newClass);
							if (attribute.newClass.split(' ').length === newClass.split(' ').length) {
								addAttribute(attribute);
								addedAttribue = true;
								break;
							}
						}
						if (!addedAttribue) {
							addAttribute(await getAttributeFromClass(defaultClassName, newClass));
						}
					}

					if (update.font) {
						const sameAttributeLocation = attributeUpdates.find(attr => attr.location === defaultClassName.location);
						if (sameAttributeLocation) {
							sameAttributeLocation.newClass += ` ${update.font}`;
						} else {
							attributeUpdates.push(await getAttribute(defaultClassName, (oldClasses) => {
								const value = oldClasses ? `${oldClasses} ${update.font}` : update.font || '';

								return {
									newClass: value,
									commentValue: update.font || ''
								}
							}));
						}
					}

					results.push(...attributeUpdates.map(attribute => addNewClassOrComment(attribute)));

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
					const {location} = locationAndValue;
					const elementSnippet = await getCodeSnippet(gitRepository)(location, branchName);

					let valuesNewLined = update.value.replaceAll(';', ';\n');
					valuesNewLined = update.font ? `font className: ${update.value}\n\n${valuesNewLined}` : valuesNewLined;
					results.push(addCommentToJSXElement({location, commentValue: valuesNewLined, code: elementSnippet, attribute: classNameAttributes[0]}));
				}
			}
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
	const listClass: [string, string][] = classes.map((klasses) => {
		if (klasses.includes(":")) {
			const [before, after] = klasses.split(":");
			if (!before || !after) {
				throw new Error("Invalid class " + klasses);
			}
			return [`${before}:`, after];
		} else if (klasses.startsWith('-')) {
			return ['-', klasses.substring(1)];
		} else {
			return ['', klasses];
		}
	});

	const withPrefix: [string, string][] = listClass.map((klasses) => {
		if (!klasses.includes(prefix)) {
			return [klasses[0], prefix + klasses[1]];
		} else {
			return klasses;
		}
	});

	const final = withPrefix.map(str => `${str[0]}${str[1]}`).join(' ');

	return final;
}