import { z } from "zod";
import { createTRPCRouter, registerdProcedure } from "../trpc";
import { accountSchema, getServerAuthSession } from "@harmony/server/auth";
import { indexCodebase } from "../services/indexor/indexor";
import { fromDir } from "../services/indexor/local";
import { fromGithub } from "../services/indexor/github";
import { GithubRepository, appOctokit } from "../repository/github";
import { Repository, repositorySchema } from "@harmony/types/branch";

const createSetupSchema = z.object({
	account: z.object({firstName: z.string(), lastName: z.string(), role: z.string()}), 
	repository: repositorySchema, 
	oauthToken: z.string()
})

export const setupRoute = createTRPCRouter({
	createRoute: registerdProcedure
		.input(createSetupSchema)
		.mutation(async ({ctx, input}) => {
			const userId = ctx.session.auth.userId;
		
			const githubRepository = new GithubRepository(input.oauthToken, input.repository);
			//await indexCodebase('', fromGithub(githubRepository));

			const newAccount = await ctx.prisma.account.create({
				data: {
					firstName: input.account.firstName,
					lastName: input.account.lastName,
					role: input.account.role,
					userId,
					oauthToken: input.oauthToken,
					repository: {
						create: {
							branch: input.repository.branch,
							name: input.repository.name,
							owner: input.repository.owner
						}
					} 
				}
			});

			return {
				firstName: newAccount.firstName,
				lastName: newAccount.lastName,
				role: newAccount.role,
			}
		}),
	getRepositories: registerdProcedure
		.query(async ({ctx}) => {
			const {data} = await appOctokit.request('GET /app/installations');

			const username = ctx.session.auth.user.username;
			const currentInstallations = data.filter(inst => inst.account?.login === username);

			if (currentInstallations.length === 0) {
				return [];
			}

			const accessTokens = await Promise.all(currentInstallations.map(inst => appOctokit.request('POST /app/installations/{installation_id}/access_tokens', {installation_id: inst.id})))

			const repositories = await Promise.all(accessTokens.map(accessToken =>fetch('https://api.github.com/installation/repositories', {
				method: "GET",
				body: null,
				headers: {
					Authorization: `token ${accessToken.data.token}`
				}
			}).then(response => response.json().then(json => ({...octokitRepositorySchema.parse(json), auth_token: accessToken.data.token})))));
			
			console.log(repositories);
			return repositories.reduce<(Repository & {oauthToken: string})[]>((prev, curr) => ([...prev, ...(curr.repositories.map(repo => ({id: '', name: repo.name, owner: repo.owner.login, branch: repo.default_branch, oauthToken: curr.auth_token})))]), []);
		})
});

const octokitRepositorySchema = z.object({
	repositories: z.array(z.object({
		name: z.string(),
		owner: z.object({
			login: z.string()
		}),
		default_branch: z.string()
	}))
})