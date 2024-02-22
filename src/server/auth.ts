import { auth, clerkClient } from "@clerk/nextjs";
import { getAuth } from '@clerk/nextjs/server';
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { prisma } from "./db";
import { GithubRepository } from "./api/repository/github";
import { Repository, repositorySchema } from "../../packages/ui/src/types/branch";
import { emailSchema } from "@harmony/ui/src/types/utils";

export interface User {
  id: string;
  name: string;
  image: string;
  username: string;
  email: string;
}

export const accountSchema = z.object({
	id: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	role: z.string(),
	repository: z.optional(repositorySchema),
	teamId: z.string(),
	contact: emailSchema
})

export type Account = z.infer<typeof accountSchema>;

export type AuthContext = {
	userId: string;
	//oauthToken: string;
	user: User
};

export type FullSession = {
	auth: AuthContext,
	account: Account
}

export type Session = {
    auth: AuthContext,
	account: Account | undefined
} | FullSession;

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

	const repository: Repository | undefined = account.team.repository.length > 0 ? {
		id: account.team.repository[0].id,
		branch: account.team.repository[0].branch,
		name: account.team.repository[0].name,
		owner: account.team.repository[0].owner,
		ref: account.team.repository[0].ref,
		installationId: account.team.repository[0].installationId,
		cssFramework: account.team.repository[0].css_framework,
		tailwindPrefix: account.team.repository[0].tailwind_prefix || undefined
	} : undefined

	return {
		id: account.id,
		firstName: account.firstName,
		lastName: account.lastName,
		repository,
		role: account.role,
		teamId: account.team_id,
		contact: emailSchema.parse(account.contact)
	}
}

export const getServerAuthSession = async (): Promise<Session | undefined> => {
	const {userId} = auth();
	let ourAuth: AuthContext | null = null;
	
	if (userId) {
		const user = await clerkClient.users.getUser(userId);
		if (user.username === null) {
			throw new Error("User does not have username");
		}

		if (!user.emailAddresses[0].emailAddress) {
			throw new Error("User does not have an email address");
		}
		ourAuth = {
			user: {
				id: user.id,
				name: `${user.firstName} ${user.lastName}`,
				image: user.imageUrl,
				username: user.username,
				email: user.emailAddresses[0].emailAddress
			},
			userId,
		}
	}
	
	const account: Account | undefined = ourAuth ? (await getAccount(userId as string)) : undefined;

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
