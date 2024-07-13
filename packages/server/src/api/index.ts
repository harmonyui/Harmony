import type { Repository } from '@harmony/util/src/types/branch'
import { prisma } from '@harmony/db/lib/prisma'
import { NodeMailerEmailService } from './services/email-service'
import { PrismaComponentUpdateRepository } from './repository/database/component-update'
import { RedisGithubCache } from './repository/cache/redis'
import {
  GithubRepositoryFactory,
  LocalGitRepository,
} from './repository/git/github'
import type { GitRepositoryFactory } from './repository/git/types'

export const mailer = new NodeMailerEmailService()
export const redisGithubCache = new RedisGithubCache()
export const githubRepository = new GithubRepositoryFactory(redisGithubCache)
export const componentUpdateRepository = new PrismaComponentUpdateRepository(
  prisma,
)

export const gitLocalRepositoryFactory: GitRepositoryFactory = {
  createGitRepository(repository: Repository) {
    return new LocalGitRepository(repository, redisGithubCache)
  },
  createGithubCache() {
    return redisGithubCache
  },
}

export const gitRepositoryFactory =
  process.env.ENV === 'development'
    ? gitLocalRepositoryFactory
    : githubRepository
