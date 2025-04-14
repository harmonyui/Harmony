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
    data: {
      id: input.id,
      branch: input.branch,
      name: input.name,
      owner: input.owner,
      ref: input.ref,
      installationId: input.installationId,
      css_framework: input.cssFramework,
      tailwind_prefix: input.tailwindPrefix,
      tailwind_config: input.tailwindConfig,
      prettier_config: input.prettierConfig,
      default_url: input.defaultUrl,
      config: input.config,
      workspace_id: workspaceId,
    },
  })

  return prismaToRepository(repository)
}
