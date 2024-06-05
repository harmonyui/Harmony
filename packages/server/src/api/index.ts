import type { Repository } from "@harmony/util/src/types/branch";
import { RedisGithubCache } from "./repository/cache";
import type { GitRepositoryFactory} from "./repository/github";
import { GithubRepositoryFactory, LocalGitRepository } from "./repository/github";
import { NodeMailerEmailService } from "./services/email-service";

export const mailer = new NodeMailerEmailService();
export const redisGithubCache = new RedisGithubCache();
export const githubRepository = new GithubRepositoryFactory(redisGithubCache);

export const gitLocalRepositoryFactory: GitRepositoryFactory = {
  createGitRepository(repository: Repository) {
    return new LocalGitRepository(repository, redisGithubCache);
  },
  createGithubCache() {
    return redisGithubCache;
  },
};