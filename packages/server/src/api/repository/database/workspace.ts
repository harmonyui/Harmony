import { Db, Prisma } from '@harmony/db/lib/prisma'
import { Repository, Workspace } from '@harmony/util/src/types/branch'
import { prismaToRepository } from './repository'

const workspacePayload = {
  include: {
    repository: true,
  },
} satisfies Prisma.WorkspaceDefaultArgs
type PrismaWorkspace = Prisma.WorkspaceGetPayload<typeof workspacePayload>

const prismaToWorkspace = (workspace: PrismaWorkspace): Workspace => {
  if (!workspace.repository) {
    throw new Error('Workspace has no repository')
  }

  return {
    id: workspace.id,
    name: workspace.name,
    repository: prismaToRepository(workspace.repository),
  }
}

export async function getWorkspacesForTeam({
  prisma,
  teamId,
}: {
  prisma: Db
  teamId: string
}): Promise<Workspace[]> {
  const workspaces: PrismaWorkspace[] = await prisma.workspace.findMany({
    where: {
      team_id: teamId,
    },
    orderBy: {
      created_at: 'desc',
    },
    ...workspacePayload,
  })

  return workspaces.map(prismaToWorkspace)
}

export async function getWorkspace({
  prisma,
  workspaceId,
}: {
  prisma: Db
  workspaceId: string
}): Promise<Workspace | null> {
  const workspace: PrismaWorkspace | null = await prisma.workspace.findUnique({
    where: {
      id: workspaceId,
    },
    ...workspacePayload,
  })

  return workspace ? prismaToWorkspace(workspace) : null
}

export async function getDefaultWorkspace({
  prisma,
  teamId,
}: {
  prisma: Db
  teamId: string
}): Promise<Workspace | null> {
  const workspace: PrismaWorkspace | null = await prisma.workspace.findFirst({
    where: {
      team_id: teamId,
    },
    ...workspacePayload,
  })

  return workspace && workspace.repository ? prismaToWorkspace(workspace) : null
}

export async function createWorkspace({
  prisma,
  name,
  teamId,
  repository,
}: {
  prisma: Db
  name: string
  teamId: string
  repository: Repository
}): Promise<Workspace> {
  const workspace: PrismaWorkspace = await prisma.workspace.create({
    data: {
      name,
      team_id: teamId,
      repository: {
        create: {
          branch: repository.branch,
          name: repository.name,
          owner: repository.owner,
          ref: repository.ref,
          installationId: repository.installationId,
          css_framework: repository.cssFramework,
          tailwind_prefix: repository.tailwindPrefix,
          tailwind_config: repository.tailwindConfig,
          prettier_config: repository.prettierConfig,
          default_url: repository.defaultUrl,
          config: repository.config,
        },
      },
    },
    ...workspacePayload,
  })

  return prismaToWorkspace(workspace)
}

export async function updateWorkspace({
  prisma,
  workspaceId,
  name,
}: {
  prisma: Db
  workspaceId: string
  name: string
}): Promise<Workspace> {
  const workspace: PrismaWorkspace = await prisma.workspace.update({
    where: {
      id: workspaceId,
    },
    data: {
      name,
    },
    ...workspacePayload,
  })

  return prismaToWorkspace(workspace)
}
