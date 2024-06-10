import type { Repository } from "@harmony/util/src/types/branch";
import { prisma } from "@harmony/db/lib/prisma";
import { RedisGithubCache } from "./repository/cache";
import type { GitRepositoryFactory} from "./repository/github";
import { GithubRepositoryFactory, LocalGitRepository } from "./repository/github";
import { NodeMailerEmailService } from "./services/email-service";
import { PrismaComponentUpdateRepository } from "./repository/database/component-update";

export const mailer = new NodeMailerEmailService();
export const redisGithubCache = new RedisGithubCache();
export const githubRepository = new GithubRepositoryFactory(redisGithubCache);
export const componentUpdateRepository = new PrismaComponentUpdateRepository(prisma);
  
export const gitLocalRepositoryFactory: GitRepositoryFactory = {
  createGitRepository(repository: Repository) {
    return new LocalGitRepository(repository, redisGithubCache);
  },
  createGithubCache() {
    return redisGithubCache;
  },
};

export const gitRepositoryFactory = process.env.ENV === 'development' ? gitLocalRepositoryFactory : githubRepository;