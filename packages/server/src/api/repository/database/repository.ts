import { Db, Prisma } from '@harmony/db/lib/prisma'
import {
  Repository,
  repositoryConfigSchema,
} from '@harmony/util/src/types/branch'

type PrismaRepository = Prisma.RepositoryGetPayload<{}>

export const prismaToRepository = (
  repository: PrismaRepository,
): Repository => {
  return {
    id: repository.id,
    branch: repository.branch,
    name: repository.name,
    owner: repository.owner,
    ref: repository.ref,
    installationId: repository.installationId,
    cssFramework: repository.css_framework,
    tailwindPrefix: repository.tailwind_prefix || undefined,
    defaultUrl: repository.default_url,
    config: {
      ...repositoryConfigSchema
        .omit({ tailwindConfig: true, prettierConfig: true })
        .parse(repository.config),
      tailwindConfig: JSON.parse(repository.tailwind_config),
      prettierConfig: JSON.parse(repository.prettier_config),
    },
    registry: {},
  }
}

export const getRepository = async ({
  prisma,
  repositoryId,
}: {
  prisma: Db
  repositoryId: string
}): Promise<Repository | undefined> => {
  const repository = await prisma.repository.findUnique({
    where: {
      id: repositoryId,
    },
  })

  if (!repository) return undefined

  return prismaToRepository(repository)
}

export function repositoryToPrisma(
  repository: Repository,
): Omit<Prisma.RepositoryUncheckedCreateInput, 'workspace_id'>
export function repositoryToPrisma(
  repository: Repository,
  workspaceId: string,
): Prisma.RepositoryUncheckedCreateInput
export function repositoryToPrisma(
  repository: Repository,
  workspaceId?: string,
):
  | Prisma.RepositoryUncheckedCreateInput
  | Omit<Prisma.RepositoryUncheckedCreateInput, 'workspace_id'> {
  return {
    id: repository.id,
    branch: repository.branch,
    name: repository.name,
    owner: repository.owner,
    ref: repository.ref,
    installationId: repository.installationId,
    css_framework: repository.cssFramework,
    tailwind_prefix: repository.tailwindPrefix,
    tailwind_config: JSON.stringify(repository.config.tailwindConfig),
    prettier_config: JSON.stringify(repository.config.prettierConfig),
    default_url: repository.defaultUrl,
    config: {
      tailwindPath: repository.config.tailwindPath,
      packageResolution: repository.config.packageResolution,
    },
    ...(workspaceId ? { workspace_id: workspaceId } : {}),
  }
}

export const createRepository = async ({
  prisma,
  repository: input,
  workspaceId,
}: {
  prisma: Db
  repository: Repository
  workspaceId: string
}) => {
  const repository = await prisma.repository.create({
    data: repositoryToPrisma(input, workspaceId),
  })

  return prismaToRepository(repository)
}
