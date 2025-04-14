import type { Db, Prisma } from '@harmony/db/lib/prisma'
import {
  repositoryConfigSchema,
  type BranchItem,
  type Repository,
} from '@harmony/util/src/types/branch'
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { compare } from '@harmony/util/src/utils/common'

const branchPayload = {
  include: {
    pullRequest: true,
    updates: {
      orderBy: {
        date_modified: 'desc',
      },
    },
  },
} satisfies Prisma.BranchDefaultArgs
type Branch = Prisma.BranchGetPayload<typeof branchPayload>

export const getBranches = async ({
  prisma,
  repositoryId,
  accountId,
}: {
  prisma: Db
  repositoryId: string
  accountId?: string
}): Promise<BranchItem[]> => {
  const branches = await prisma.branch.findMany({
    where: {
      repository_id: repositoryId,
      is_deleted: false,
      account_id: accountId,
    },
    orderBy: {
      date_modified: 'desc',
    },
    ...branchPayload,
  })

  return (await Promise.all(
    branches.map((branch) => prismaToBranch(branch)),
  )) satisfies BranchItem[]
}

const getLastUpdated = (branch: Branch): Date => {
  if (branch.updates.length) {
    return branch.updates.sort((a, b) =>
      compare(b.date_modified, a.date_modified),
    )[0].date_modified
  }

  return branch.date_modified
}

const prismaToBranch = (branch: Branch): BranchItem => {
  return {
    id: branch.id,
    name: branch.name,
    label: branch.label,
    url: branch.url,
    pullRequestUrl: branch.pullRequest?.url ?? undefined,
    commits: [],
    lastUpdated: getLastUpdated(branch),
  }
}

export const createBranch = async ({
  prisma,
  branch,
  accountId,
  repositoryId,
}: {
  prisma: Db
  branch: BranchItem
  accountId: string
  repositoryId: string
}) => {
  const newBranch = await prisma.branch.create({
    data: {
      repository_id: repositoryId,
      label: branch.label,
      name: branch.name,
      url: branch.url,
      account: {
        connect: {
          id: accountId,
        },
      },
    },
    ...branchPayload,
  })

  const lastUpdated = getLastUpdated(newBranch)

  return {
    id: newBranch.id,
    label: newBranch.label,
    name: newBranch.name,
    url: newBranch.url,
    commits: [],
    lastUpdated,
  } satisfies BranchItem
}

export const getBranch = async ({
  prisma,
  branchId,
}: {
  prisma: Db
  branchId: string
}) => {
  const branch = await prisma.branch.findUnique({
    where: {
      id: branchId,
      is_deleted: false,
    },
    ...branchPayload,
  })

  if (!branch) return undefined

  //TODO: Get rid of hacky property additions and make that global
  return {
    id: branch.id,
    name: branch.name,
    label: branch.label,
    url: branch.url,
    repositoryId: branch.repository_id,
    pullRequestUrl: branch.pullRequest?.url ?? undefined,
    commits: [], //await githubRepository.getCommits(branch.name),
    lastUpdated: getLastUpdated(branch),
    updates: branch.updates.map((update) => ({
      type: update.type as ComponentUpdate['type'],
      name: update.name,
      value: update.value,
      oldValue: update.old_value,
      componentId: update.component_id,
      childIndex: update.childIndex,
      isGlobal: update.is_global,
      dateModified: update.date_modified,
    })),
    old: branch.updates.map((update) => update.old_value),
  } satisfies BranchItem & {
    repositoryId: string
    updates: (ComponentUpdate & { dateModified: Date })[]
    old: string[]
  }
}
