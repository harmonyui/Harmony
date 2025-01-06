import type { Repository } from '@harmony/util/src/types/branch'
import { prisma } from '@harmony/db/lib/prisma'
import { NodeMailerEmailService } from './services/email-service'
import { PrismaComponentUpdateRepository } from './repository/database/component-update'
import { RedisGithubCache } from './repository/cache/redis'
import { GithubRepositoryFactory } from './repository/git/github'
import { LocalGitRepository } from './repository/git/local-git'

export const mailer = new NodeMailerEmailService()
export const redisGithubCache = new RedisGithubCache()
export const githubRepository = new GithubRepositoryFactory(redisGithubCache)
export const componentUpdateRepository = new PrismaComponentUpdateRepository(
  prisma,
)

export const createLocalGitRepositoryFactory = (localPath: string) => ({
  createGitRepository(repository: Repository) {
    return new LocalGitRepository(repository, redisGithubCache, localPath)
  },
  createGithubCache() {
    return redisGithubCache
  },
})
