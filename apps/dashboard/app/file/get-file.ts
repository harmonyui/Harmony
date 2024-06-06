'use server';
import { prisma } from "@harmony/db/lib/prisma";
import { gitRepositoryFactory } from "@harmony/server/src/api";
import { getRepository } from "@harmony/server/src/api/routers/branch";


export async function onSubmit({repositoryId, file}: {repositoryId: string, file: string}): Promise<string> {
    const repository = await getRepository({prisma, repositoryId});
    if (!repository) {
        return 'Invalid repository id';
    }
    const githubRepository = gitRepositoryFactory.createGitRepository(repository);

    return githubRepository.getContent(file);
}