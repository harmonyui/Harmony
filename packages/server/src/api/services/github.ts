import { prisma } from '@harmony/db/lib/prisma'
import { gitRepositoryFactory } from '..'
import { getRepository } from '../repository/database/repository'

const repositoryId = 'da286f25-b5de-4003-94ed-2944162271ed'
export const getNumStars = async () => {
  const repository = await getRepository({
    prisma,
    repositoryId,
  })
  if (!repository) {
    return null
  }
  const gitRepository = gitRepositoryFactory.createGitRepository(repository)
  return gitRepository.getStarCount()
}

export const getProjectUrl = async () => {
  const repository = await getRepository({
    prisma,
    repositoryId,
  })
  if (!repository) {
    return null
  }
  const gitRepository = gitRepositoryFactory.createGitRepository(repository)
  return gitRepository.getProjectUrl()
}
