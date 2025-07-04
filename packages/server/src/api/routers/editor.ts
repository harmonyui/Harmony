import type { ComponentUpdate } from '@harmony/util/src/types/component'
import {
  codeUpdatesRequestSchema,
  codeUpdatesResponseSchema,
  createProjectRequestSchema,
  createUpdateFromTextRequestSchema,
  createUpdateFromTextResponseSchema,
  indexComponentsRequestSchema,
  indexComponentsResponseSchema,
  loadRequestSchema,
  loadResponseSchema,
  publishRequestSchema,
  updateRequestBodySchema,
  updateChatBubbleRequestSchema,
  updateChatBubbleResponseSchema,
  createChatBubbleRequestSchema,
  createChatBubbleResponseSchema,
  deleteChatBubbleRequestSchema,
  deleteChatBubbleResponseSchema,
} from '@harmony/util/src/types/network'
import type {
  PublishResponse,
  UpdateResponse,
} from '@harmony/util/src/types/network'
import { reverseUpdates } from '@harmony/util/src/utils/component'
import type { Token } from '@harmony/util/src/types/tokens'
import { z } from 'zod'
import {
  formatComponentAndErrors,
  indexForComponents,
} from '../services/indexor/indexor'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { updateFileCache } from '../services/updator/update-cache'
import { Publisher } from '../services/publish/publisher'
import { generateUpdatesFromText } from '../repository/openai'
import { getBranch, createBranch } from '../repository/database/branch'
import { resolveTailwindConfig } from '../repository/tailwind/tailwind'
import {
  createComponentUpdates,
  getComponentUpdates,
} from '../services/component-update'
import { CachedGitRepository } from '../repository/git/cached-git'
import {
  isRepository,
  Repository,
  RepositoryConfig,
} from '@harmony/util/src/types/branch'
import { Db } from '@harmony/db/lib/prisma'
import { wordToKebabCase } from '@harmony/util/src/utils/common'
import { getRepository } from '../repository/database/repository'
import {
  createChatBubble,
  getChatBubbles,
  updateChatBubble as updateChatBubbleRepo,
  deleteChatBubble as deleteChatBubbleRepo,
} from '../repository/database/chat'

const returnRepository = async (
  repositoryOrId: string | RepositoryConfig | undefined,
  prisma: Db,
): Promise<Repository | RepositoryConfig | undefined> => {
  const repositoryId =
    typeof repositoryOrId === 'string' ? repositoryOrId : undefined
  let repository: Repository | RepositoryConfig | undefined =
    typeof repositoryOrId !== 'string' ? repositoryOrId : undefined
  if (repository !== undefined) {
    return repository
  }
  if (repositoryId !== undefined) {
    repository = await getRepository({
      prisma,
      repositoryId,
    })
    if (!repository) {
      throw new Error(`Cannot find repository with id ${repositoryId}`)
    }

    return repository
  }
}

const editorRoutes = {
  loadProject: protectedProcedure
    .input(loadRequestSchema)
    .output(loadResponseSchema)
    .query(async ({ ctx, input }) => {
      const { repositoryId, branchId, repositoryConfig } = input
      const { prisma } = ctx
      const isLocal = branchId === 'local' || !branchId

      const pullRequest = await prisma.pullRequest.findUnique({
        where: {
          branch_id: branchId,
        },
      })

      const accountTiedToBranch = await prisma.account.findFirst({
        where: {
          id: ctx.session.account.id,
          branch: {
            some: {
              id: branchId,
            },
          },
        },
      })

      if (!accountTiedToBranch && !isLocal) {
        throw new Error(`Cannot find account tied to branch ${branchId}`)
      }

      const updates = isLocal
        ? []
        : await getComponentUpdates(branchId, ctx.componentUpdateRepository)

      let tokens: Token[] = []
      const repository = await returnRepository(
        repositoryConfig ?? repositoryId,
        prisma,
      )

      tokens = repository
        ? isRepository(repository)
          ? await resolveTailwindConfig(repository.config.tailwindConfig)
          : await resolveTailwindConfig(repository.tailwindConfig)
        : []

      if (repository !== undefined && isRepository(repository)) {
        const githubRepository =
          ctx.gitRepositoryFactory.createGitRepository(repository)

        const ref = repository.branch
          ? await githubRepository.getBranchRef(repository.branch)
          : ''

        //If the current repository ref is out of date, that means we have some
        //new commits that might affect our previously indexed component elements.
        //Let's go through the diffs and update those component ids
        if (ref !== repository.ref) {
          if (!repository.ref.startsWith('http')) {
            await updateFileCache(
              ctx.gitRepositoryFactory,
              repository,
              repository.ref,
              ref,
            )
          }
          await prisma.repository.update({
            where: {
              id: repository.id,
            },
            data: {
              ref,
            },
          })
        }
      }

      const branches = await prisma.branch.findMany({
        where: {
          repository_id: repositoryId,
        },
      })

      const isDemo = accountTiedToBranch?.role === 'quick'

      const chatBubbles = isLocal
        ? []
        : await getChatBubbles({ prisma, branchId })

      return {
        updates,
        branches: branches.map((branch) => ({
          id: branch.id,
          name: branch.label,
          label: branch.name,
        })),
        pullRequest: pullRequest || undefined,
        showWelcomeScreen: isDemo && !accountTiedToBranch.seen_welcome_screen,
        isDemo,
        harmonyTokens: tokens,
        chatBubbles,
        rootPath: undefined,
      }
    }),
  saveProject: protectedProcedure
    .input(updateRequestBodySchema)
    .mutation(async ({ ctx, input }) => {
      const { branchId, repositoryId } = input
      const body = input
      const { prisma } = ctx

      const branch = branchId
        ? await prisma.branch.findUnique({
            where: {
              id: branchId,
            },
          })
        : undefined

      if (branchId && !branch) {
        throw new Error(`Cannot find branch with id ${branchId}`)
      }

      const pullRequest = await prisma.pullRequest.findUnique({
        where: {
          branch_id: branchId,
        },
      })

      if (pullRequest) {
        throw new Error('Cannot make changes on a published branch')
      }

      const repository = await getRepository({
        prisma,
        repositoryId: repositoryId ?? branch?.repository_id ?? '',
      })
      if (!repository) {
        throw new Error(
          `Cannot find repository with id ${repositoryId ?? branch?.repository_id ?? ''}`,
        )
      }

      if (branchId) {
        const accountTiedToBranch = await prisma.account.findFirst({
          where: {
            branch: {
              some: {
                id: branchId,
              },
            },
          },
        })

        if (!accountTiedToBranch) {
          throw new Error(`Cannot find account tied to branch ${branchId}`)
        }

        await prisma.account.update({
          where: {
            id: accountTiedToBranch.id,
          },
          data: {
            seen_welcome_screen: true,
          },
        })
      }

      //const gitRepository = ctx.gitRepositoryFactory.createGitRepository(repository);
      const updates: ComponentUpdate[] = []
      const errorUpdates: (ComponentUpdate & { errorType: string })[] = []
      //Indexes the files of these component updates
      for (const value of body.values) {
        for (const update of value.update) {
          if (!update.componentId) continue

          //TODO: Be able to handle dynamic components so we don't have to do this
          const split = update.componentId.split('#')
          if (
            split.length > 1 &&
            /pages\/_app\.(tsx|jsx|js)/.exec(atob(split[0]))
          ) {
            update.componentId = split.slice(1).join('#')
          }

          const error = await prisma.componentError.findFirst({
            where: {
              component_id: update.componentId,
              repository_id: repositoryId ?? branch?.repository_id ?? '',
              type: update.type,
            },
          })

          if (!error) {
            updates.push(update)
          } else {
            errorUpdates.push({ ...update, errorType: error.type })
          }
        }
      }

      if (branchId) {
        await createComponentUpdates(
          updates,
          branchId,
          ctx.componentUpdateRepository,
        )
      }

      const reversed = reverseUpdates(errorUpdates)
      const response: UpdateResponse = { errorUpdates: reversed }
      return response
    }),
  publishProject: protectedProcedure
    .input(publishRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const data = input
      const { branchId, pullRequest } = data
      const { prisma } = ctx

      const branch = await getBranch({ prisma, branchId })
      if (!branch) {
        throw new Error(`Cannot find branch with id ${branchId}`)
      }

      const repository = await getRepository({
        prisma,
        repositoryId: branch.repositoryId,
      })
      if (!repository) {
        throw new Error(`Cannot find repository with id ${branch.repositoryId}`)
      }

      const alreadyPublished = await prisma.pullRequest.findUnique({
        where: {
          branch_id: branch.id,
        },
      })

      if (alreadyPublished) {
        throw new Error('This project has already been published')
      }

      const updates = await getComponentUpdates(
        branchId,
        ctx.componentUpdateRepository,
      )

      const gitRepository =
        ctx.gitRepositoryFactory.createGitRepository(repository)
      const publisher = new Publisher(gitRepository)
      const newPullRequest = await publisher.publishChanges(
        updates,
        branch,
        pullRequest,
      )

      const response: PublishResponse = { pullRequest: newPullRequest }

      return response
    }),
  indexComponents: protectedProcedure
    .input(indexComponentsRequestSchema)
    .output(indexComponentsResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const { repositoryId, contents } = input

      const repository = await returnRepository(repositoryId, ctx.prisma)

      if (!repository) {
        throw new Error(`Cannot find repository with id ${repositoryId}`)
      }

      const gitRepository = !isRepository(repository)
        ? new CachedGitRepository(repository, contents ?? [])
        : ctx.gitRepositoryFactory.createGitRepository(repository)

      const instances = await indexForComponents(
        input.components,
        gitRepository,
      )
      const { harmonyComponents, errorElements } =
        formatComponentAndErrors(instances)

      return {
        harmonyComponents,
        errorElements: errorElements.map((error) => ({
          componentId: error.id,
          type: error.type,
        })),
      }
    }),

  getCodeUpdates: protectedProcedure
    .input(codeUpdatesRequestSchema)
    .output(codeUpdatesResponseSchema)
    .mutation(async ({ input }) => {
      const { repositoryConfig, updates, contents } = input

      const gitRepository = new CachedGitRepository(repositoryConfig, contents)
      const publisher = new Publisher(gitRepository)
      const updateChanges = await publisher.updateChanges(updates)

      return updateChanges.map((change) => ({
        content: change.newContent,
        path: change.filePath,
      }))
    }),

  createUpdatesFromText: protectedProcedure
    .input(createUpdateFromTextRequestSchema)
    .output(createUpdateFromTextResponseSchema)
    .mutation(async ({ input }) => {
      const newAttributes = await generateUpdatesFromText(
        input.text,
        input.currentAttributes,
      )
      const updates: ComponentUpdate[] = newAttributes.map((attr) => ({
        name: attr.name,
        type: 'className',
        componentId: input.componentId,
        value: attr.value,
        oldValue:
          input.currentAttributes.find((curr) => curr.name === attr.name)
            ?.value ?? '',
        isGlobal: false,
        childIndex: input.childIndex,
        dateModified: new Date(),
      }))

      return updates
    }),
  getRepository: protectedProcedure
    .input(z.object({ repositoryId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx
      const repository = await getRepository({
        prisma,
        repositoryId: input.repositoryId,
      })
      if (!repository) {
        throw new Error(`Cannot find repository with id ${input.repositoryId}`)
      }

      return repository
    }),
  createProject: protectedProcedure
    .input(createProjectRequestSchema)
    .mutation(async ({ ctx, input }) => {
      return createBranch({
        prisma: ctx.prisma,
        branch: {
          name: wordToKebabCase(input.name),
          url: input.url,
          lastUpdated: new Date(),
          label: input.name,
          commits: [],
          id: '',
        },
        repositoryId: input.repositoryId,
        accountId: ctx.session.account.id,
      })
    }),
  createChatBubble: protectedProcedure
    .input(createChatBubbleRequestSchema)
    .output(createChatBubbleResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx
      return createChatBubble({
        prisma,
        branchId: input.branchId,
        componentId: input.componentId,
        content: input.content,
        offsetX: input.offsetX,
        offsetY: input.offsetY,
        childIndex: input.childIndex,
        accountId: ctx.session?.account?.id,
      })
    }),

  updateChatBubble: protectedProcedure
    .input(updateChatBubbleRequestSchema)
    .output(updateChatBubbleResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx
      return updateChatBubbleRepo({
        prisma,
        id: input.id,
        content: input.content,
        offsetX: input.offsetX,
        offsetY: input.offsetY,
      })
    }),

  deleteChatBubble: protectedProcedure
    .input(deleteChatBubbleRequestSchema)
    .output(deleteChatBubbleResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx
      await deleteChatBubbleRepo({
        prisma,
        id: input.id,
      })
      return { success: true }
    }),
} satisfies Parameters<typeof createTRPCRouter>[0]

export const editorRouter = createTRPCRouter(editorRoutes)
export type EditorRoutes = typeof editorRoutes
