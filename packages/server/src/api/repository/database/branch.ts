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

  return {
    id: repository.id,
    branch: repository.branch,
    name: repository.name,
    owner: repository.owner,
    ref: repository.ref,
    installationId: repository.installationId,
    cssFramework: repository.css_framework,
    tailwindPrefix: repository.tailwind_prefix || undefined,
    tailwindConfig: repository.tailwind_config,
    defaultUrl: repository.default_url,
    prettierConfig: repository.prettier_config,
    config: repositoryConfigSchema.parse(repository.config),
    registry: {
      Button: {
        name: 'Button',
        implementation: '<Button>Click me</Button>',
        dependencies: [
          {
            isDefault: false,
            name: 'Button',
            path: '@/components/button',
          },
        ],
        props: [
          {
            type: 'classVariant',
            name: 'variant',
            defaultValue: 'default',
            values: {
              default:
                'bg-primary text-primary-foreground shadow hover:bg-primary/90',
              destructive:
                'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
              outline:
                'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
              secondary:
                'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
              ghost: 'hover:bg-accent hover:text-accent-foreground',
              link: 'text-primary underline-offset-4 hover:underline',
            },
            mapping: '',
            mappingType: 'attribute',
            isEditable: true,
          },
          {
            type: 'classVariant',
            name: 'size',
            defaultValue: 'default',
            values: {
              default: 'h-9 px-4 py-2',
              sm: 'h-8 rounded-md px-3 text-xs',
              lg: 'h-10 rounded-md px-8',
              icon: 'h-9 w-9',
            },
            mapping: '',
            mappingType: 'attribute',
            isEditable: true,
          },
          {
            type: 'string',
            name: 'children',
            defaultValue: 'Click me',
            values: {},
            mapping: '',
            mappingType: 'attribute',
            isEditable: true,
          },
        ],
      },
    },
  }
}

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
