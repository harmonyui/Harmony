/* eslint-disable no-await-in-loop -- ok*/
import type { ComponentUpdate } from "@harmony/util/src/types/component";
import { indexComponentsRequestSchema, indexComponentsResponseSchema, loadRequestSchema, loadResponseSchema, publishRequestSchema, updateRequestBodySchema} from '@harmony/util/src/types/network';
import type { PublishResponse, UpdateResponse } from '@harmony/util/src/types/network';
import { reverseUpdates } from "@harmony/util/src/utils/component";
import { formatComponentAndErrors, indexForComponents} from "../services/indexor/indexor";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { updateFileCache } from "../services/updator/update-cache";
import { Publisher } from "../services/publish/publisher";
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

			const updates = await ctx.componentUpdateRepository.getUpdates(branchId);

			const githubRepository = ctx.gitRepositoryFactory.createGitRepository(repository);
			
            const ref = await githubRepository.getBranchRef(repository.branch);

            //If the current repository ref is out of date, that means we have some
            //new commits that might affect our previously indexed component elements.
            //Let's go through the diffs and update those component ids
            if (ref !== repository.ref) {
				if (!repository.ref.startsWith('http')) {
					// await updateComponentIdsFromUpdates(updates, repository.ref, githubRepository);
					await updateFileCache(ctx.gitRepositoryFactory, repository, repository.ref, ref);
				}
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

			

			const isDemo = accountTiedToBranch.role === 'quick';

			return {
				updates,
				branches: branches.map(branch => ({
					id: branch.id,
					name: branch.label
				})),
				pullRequest: pullRequest || undefined,
				showWelcomeScreen: isDemo && !accountTiedToBranch.seen_welcome_screen,
				isDemo: true,
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

			//const gitRepository = ctx.gitRepositoryFactory.createGitRepository(repository);
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

					const error = await prisma.componentError.findFirst({
						where: {
							component_id: update.componentId,
							repository_id: branch.repository_id,
							type: update.type
						}
					});


					if (!error) {
						updates.push(update);
					} else {
						errorUpdates.push({ ...update, errorType: error.type });
					}
				}
			}

			await ctx.componentUpdateRepository.createUpdates(updates, branchId);

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

			const gitRepository = ctx.gitRepositoryFactory.createGitRepository(repository);
			const publisher = new Publisher(gitRepository);
			const newPullRequest = await publisher.publishChanges(branch.updates, branch, pullRequest);

			const response: PublishResponse = { pullRequest: newPullRequest };

			return response;
		}),
	indexComponents: publicProcedure
		.input(indexComponentsRequestSchema)
		.output(indexComponentsResponseSchema)
		.mutation(async ({ctx, input}) => {
			const {branchId} = input;
			const branch = await getBranch({ prisma: ctx.prisma, branchId });
			if (!branch) {
				throw new Error(`Cannot find branch with id ${branchId}`);
			}

			const repository = await getRepository({ prisma: ctx.prisma, repositoryId: branch.repositoryId });
			if (!repository) {
				throw new Error(`Cannot find repository with id ${branch.repositoryId}`);
			}

			const gitRepository = ctx.gitRepositoryFactory.createGitRepository(repository);
			
			const instances = await indexForComponents(input.components, gitRepository);
			const {harmonyComponents, errorElements} = formatComponentAndErrors(instances);

			return {harmonyComponents, errorElements: errorElements.map(error => ({componentId: error.id, type: error.type}))};
		})
})