import { auth, clerkClient } from "@clerk/nextjs";
import { getAuth } from '@clerk/nextjs/server';
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { prisma } from "./db";
import { GithubRepository } from "./api/repository/github";
import { Repository, repositorySchema } from "../../packages/ui/src/types/branch";
import { emailSchema } from "@harmony/ui/src/types/utils";
import { Prisma } from "@prisma/client";

export interface User {
  id: string;
  name: string;
  image: string;
  email: string;
}

export const accountSchema = z.object({
	id: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	role: z.string(),
	repository: z.optional(repositorySchema),
	teamId: z.string(),
	contact: emailSchema,
	seenWelcomeScreen: z.boolean()
})

export type Account = z.infer<typeof accountSchema>;

export type AuthContext = {
	userId: string;
	//oauthToken: string;
	user: User,
	role: string
};

export type FullSession = {
	auth: AuthContext,
	account: Account
}

export type Session = {
    auth: AuthContext,
	account: Account | undefined
} | FullSession;

const teamPayload = {include: {repository: true}}

export const getRepositoryFromTeam = (team: Prisma.TeamGetPayload<typeof teamPayload>): Repository | undefined => {
	return team.repository.length > 0 ? {
		id: team.repository[0].id,
		branch: team.repository[0].branch,
		name: team.repository[0].name,
		owner: team.repository[0].owner,
		ref: team.repository[0].ref,
		installationId: team.repository[0].installationId,
		cssFramework: team.repository[0].css_framework,
		tailwindPrefix: team.repository[0].tailwind_prefix || undefined,
		defaultUrl: team.repository[0].default_url
	} : undefined;
}

export const getAccount = async (userId: string): Promise<Account | undefined> => {
	const account = await prisma.account.findFirst({
		where: {
			userId
		},
		include: {
			team: {
				include: {
					repository: true
				}
			}
		}
	});

	if (account === null) return undefined;

	const repository: Repository | undefined = getRepositoryFromTeam(account.team);

	return {
		id: account.id,
		firstName: account.firstName,
		lastName: account.lastName,
		repository,
		role: account.role,
		teamId: account.team_id,
		contact: emailSchema.parse(account.contact),
		seenWelcomeScreen: account.seen_welcome_screen
	}
}

const harmonyAdmins = ['bradofrado@gmail.com', 'braydon.jones28@gmail.com', 'jacobwyliehansen@gmail.com'];
export const getServerAuthSession = async (mockUserId?: string): Promise<Session | undefined> => {
	const {userId} = auth()// : {userId: null};
	let ourAuth: AuthContext | null = null;
	
	if (userId) {
		const user = await clerkClient.users.getUser(userId);

		if (!user.emailAddresses[0].emailAddress) {
			throw new Error("User does not have an email address");
		}
		const email = user.emailAddresses[0].emailAddress;
		ourAuth = {
			user: {
				id: user.id,
				name: `${user.firstName} ${user.lastName}`,
				image: user.imageUrl,
				email
			},
			userId,
			role: harmonyAdmins.includes(email) ? 'harmony-admin' : 'user'
		}
	}
	
	const userIdToUse = mockUserId !== 'none' ? mockUserId || userId : null;
	const account: Account | undefined = ourAuth && userIdToUse ? (await getAccount(userIdToUse)) : undefined;

	if (account?.contact === 'example@gmail.com' && ourAuth) {
		account.contact = emailSchema.parse(ourAuth.user.email);
		await prisma.account.update({
			where: {
				id: account.id
			},
			data: {
				contact: ourAuth.user.email
			}
		});
	}

	return ourAuth ? {
		auth: ourAuth,
		account
	} : undefined
}
