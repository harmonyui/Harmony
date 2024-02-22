import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure, registerdProcedure } from "../trpc";
import { accountSchema, getAccount, getServerAuthSession } from "../../../../src/server/auth";
import { indexCodebase } from "../services/indexor/indexor";
import { fromDir } from "../services/indexor/local";
import { fromGithub } from "../services/indexor/github";
import { GithubRepository, appOctokit } from "../repository/github";
import { Repository, repositorySchema } from "../../../../packages/ui/src/types/branch";
import {components} from '@octokit/openapi-types/types'

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
	connectRepository: publicProcedure
		.input(z.object({repository: repositorySchema, teamId: z.string()}))
		.mutation(async ({ctx, input}) => {
			const teamId = input.teamId;
			const newRepository = await ctx.prisma.repository.create({
				data: {
					id: input.repository.id,
					branch: input.repository.branch,
					name: input.repository.name,
					owner: input.repository.owner,
					ref: input.repository.ref,
					installationId: input.repository.installationId,
					team_id: teamId,
					css_framework: input.repository.cssFramework,
					tailwind_prefix: input.repository.tailwindPrefix
				}
			});

			return {
				id: newRepository.id,
				branch: newRepository.branch,
				installationId: newRepository.installationId,
				name: newRepository.name,
				owner: newRepository.owner,
				ref: newRepository.ref,
				tailwindPrefix: newRepository.tailwind_prefix || undefined,
				cssFramework: newRepository.css_framework,
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
	getRepositories: publicProcedure
		.input(z.object({accessToken: z.string()}))
		.query(async ({input}) => {
			//const {data} = await appOctokit.request('GET /app/installations');

			//const username = ctx.session.auth.user.username;
			const accessToken = input.accessToken;
			//const {data} = await appOctokit.request('GET /user/installations');
			const response = await fetch('https://api.github.com/user/installations', {
				method: "GET",
				headers: {
					authorization: `token ${accessToken}`
			}});
			if (!response.ok) {
				const json = await response.json();
				throw new Error(json);
			}
			const data = await response.json() as {installations: components["schemas"]["installation"][]}
			const currentInstallations = data.installations//.filter(inst => inst.account?.login === '');

			if (currentInstallations.length === 0) {
				return [];
			}

			const accessTokens = await Promise.all(currentInstallations.map(inst => appOctokit.request('POST /app/installations/{installation_id}/access_tokens', {installation_id: inst.id}).then(value => ({...value, data: {...value.data, installation_id: inst.id}}))))

			// const {data: d} = await appOctokit.request('GET /installation/repositories');
			// const repos: components["schemas"]["repository"] = d.repositories
			const repositories = await Promise.all(accessTokens.map(accessToken =>fetch('https://api.github.com/installation/repositories', {
				method: "GET",
				body: null,
				headers: {
					Authorization: `token ${accessToken.data.token}`
				}
			}).then(response => response.json().then(json => ({...octokitRepositorySchema.parse(json), auth_token: accessToken.data.token, installation_id: accessToken.data.installation_id})))));
			
			return repositories.reduce<(Repository)[]>((prev, curr) => ([...prev, ...(curr.repositories.map(repo => ({id: crypto.randomUUID(), name: repo.name, owner: repo.owner.login, branch: repo.default_branch, ref: repo.git_refs_url, oauthToken: curr.auth_token, installationId: curr.installation_id, cssFramework: 'other', tailwindPrefix: undefined})))]), []);
		})
});

const octokitRepositorySchema = z.object({
	repositories: z.array(z.object({
		name: z.string(),
		owner: z.object({
			login: z.string()
		}),
		default_branch: z.string(),
		git_refs_url: z.string()
	}))
})

function getOauthToken() {
	
}

//https://neutral-mink-38.clerk.accounts.dev/v1/oauth_callback