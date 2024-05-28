'use server';
import { prisma } from "@harmony/db/lib/prisma";
import { GithubRepository } from "@harmony/server/src/api/repository/github";
import { getRepository } from "@harmony/server/src/api/routers/branch";


export async function onSubmit({repositoryId, file}: {repositoryId: string, file: string}): Promise<string> {
    const repository = await getRepository({prisma, repositoryId});
    if (!repository) {
        return 'Invalid repository id';
    }
    const githubRepository = new GithubRepository(repository);

    return githubRepository.getContent(file);
}