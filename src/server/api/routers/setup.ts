import { z } from "zod";
import { createTRPCRouter, protectedProcedure, registerdProcedure } from "../trpc";
import { accountSchema, getAccount, getServerAuthSession } from "../../../../src/server/auth";
import { indexCodebase } from "../services/indexor/indexor";
import { fromDir } from "../services/indexor/local";
import { fromGithub } from "../services/indexor/github";
import { GithubRepository, appOctokit } from "../repository/github";
import { Repository, repositorySchema } from "../../../../packages/ui/src/types/branch";

const createSetupSchema = z.object({
	account: z.object({firstName: z.string(), lastName: z.string(), role: z.string()}),  
	teamId: z.optional(z.string())
})

export const setupRoute = createTRPCRouter({
	getAccount: registerdProcedure
		.query(async ({ctx}) => {
			const userId = ctx.session.auth.userId;

			return getAccount(userId);
			// const account = await ctx.prisma.account.findFirst({
			// 	where: {
			// 		userId
			// 	}
			// });
			// if (!account) return undefined;

			// return {
			// 	firstName: account.firstName,
			// 	lastName: account.lastName,
			// 	role: account.role,
			// }
		}),
	createAccount: registerdProcedure
		.input(createSetupSchema)
		.mutation(async ({ctx, input}) => {
			const userId = ctx.session.auth.userId;

			const newAccount = await ctx.prisma.account.create({
				data: {
					firstName: input.account.firstName,
					lastName: input.account.lastName,
					role: input.account.role,
					userId,
					team: {
						connectOrCreate: {
							where: {
								id: input.teamId,
							},
							create: {
								id: input.teamId,
							}
						}
					}
				}
			});
		
			return {
				id: newAccount.id,
				firstName: newAccount.firstName,
				lastName: newAccount.lastName,
				role: newAccount.role,
				repository: undefined,
				teamId: newAccount.team_id
			}
		}),
	sendDeveloperEmail: protectedProcedure
		.input(z.object({email: z.string()}))
		.mutation(async ({ctx, input}) => {
			const email = input.email;

		}),
	connectRepository: protectedProcedure
		.input(z.object({repository: repositorySchema}))
		.mutation(async ({ctx, input}) => {
			const teamId = ctx.session.account.teamId;
			const newRepository = await ctx.prisma.repository.create({
				data: {
					id: input.repository.id,
					branch: input.repository.branch,
					name: input.repository.name,
					owner: input.repository.owner,
					installationId: input.repository.installationId,
					team_id: teamId
				}
			});

			return {
				id: newRepository.id,
				branch: newRepository.branch,
				installationId: newRepository.installationId,
				name: newRepository.name,
				owner: newRepository.owner
			} satisfies Repository
		}),
	// importRepository: protectedProcedure
	// 	.input(z.object({repository: repositorySchema}))
	// 	.mutation(async ({ctx, input}) => {
	// 		const accountId = ctx.session.account.id;

	// 		const newRepository = await ctx.prisma.repository.create({
	// 			data: {
	// 				id: input.repository.id ?? undefined,
	// 				branch: input.repository.branch,
	// 				name: input.repository.name,
	// 				owner: input.repository.owner,
	// 				installationId: input.repository.installationId,
	// 				account_id: accountId
	// 			}
	// 		});

			
	// 	}),
	getRepositories: registerdProcedure
		.query(async ({ctx}) => {
			const {data} = await appOctokit.request('GET /app/installations');

			const username = ctx.session.auth.user.username;
			const currentInstallations = data.filter(inst => inst.account?.login === username);

			if (currentInstallations.length === 0) {
				return [];
			}

			const accessTokens = await Promise.all(currentInstallations.map(inst => appOctokit.request('POST /app/installations/{installation_id}/access_tokens', {installation_id: inst.id}).then(value => ({...value, data: {...value.data, installation_id: inst.id}}))))

			const repositories = await Promise.all(accessTokens.map(accessToken =>fetch('https://api.github.com/installation/repositories', {
				method: "GET",
				body: null,
				headers: {
					Authorization: `token ${accessToken.data.token}`
				}
			}).then(response => response.json().then(json => ({...octokitRepositorySchema.parse(json), auth_token: accessToken.data.token, installation_id: accessToken.data.installation_id})))));
			
			return repositories.reduce<(Repository)[]>((prev, curr) => ([...prev, ...(curr.repositories.map(repo => ({id: crypto.randomUUID(), name: repo.name, owner: repo.owner.login, branch: repo.default_branch, oauthToken: curr.auth_token, installationId: curr.installation_id})))]), []);
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

function getOauthToken() {
	
}