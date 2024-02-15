import { auth, clerkClient } from "@clerk/nextjs";
import { getAuth } from '@clerk/nextjs/server';
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { prisma } from "./db";
import { GithubRepository } from "./api/repository/github";
import { Repository, repositorySchema } from "../../packages/ui/src/types/branch";

export interface User {
  id: string;
  name: string;
  image: string;
  username: string;
}

export const accountSchema = z.object({
	id: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	role: z.string(),
	repository: z.optional(repositorySchema),
	teamId: z.string(),
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

	return {
		id: account.id,
		firstName: account.firstName,
		lastName: account.lastName,
		repository: account.team.repository[0],
		role: account.role,
		teamId: account.team_id
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
		ourAuth = {
			user: {
				id: user.id,
				name: `${user.firstName} ${user.lastName}`,
				image: user.imageUrl,
				username: user.username
			},
			userId,
		}
	}
	
	const account: Account | undefined = ourAuth ? (await getAccount(userId as string)) : undefined;

	return ourAuth ? {
		auth: ourAuth,
		account
	} : undefined
}
