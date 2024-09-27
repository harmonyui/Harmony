'use server'
import { prisma } from '@harmony/db/lib/prisma'
import { gitRepositoryFactory } from '@harmony/server/src/api'
import { getRepository } from '@harmony/server/src/api/repository/database/branch'

export async function onSubmit({
  repositoryId,
  file,
}: {
  repositoryId: string
  file: string
}): Promise<string> {
  const repository = await getRepository({ prisma, repositoryId })
  if (!repository) {
    return 'Invalid repository id'
  }
  const githubRepository = gitRepositoryFactory.createGitRepository(repository)

  const content = await githubRepository.getContentOrDirectory(file)

  if ('content' in content) {
    return content.content
  }

  return Array.isArray(content)
    ? content.map((c) => c.path).join('\n')
    : content.path
}
