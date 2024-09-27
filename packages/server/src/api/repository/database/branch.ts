import type { Db } from '@harmony/db/lib/prisma'
import type { Repository } from '@harmony/util/src/types/branch'

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
    defaultUrl: repository.default_url,
  }
}
