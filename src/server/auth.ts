import { auth, clerkClient } from "@clerk/nextjs";
import { getAuth } from '@clerk/nextjs/server';
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { prisma } from "./db";
import { GithubRepository } from "./api/repository/github";
import { Repository, repositorySchema } from "@harmony/types/branch";

export interface User {
  id: string;
  name: string;
  image: string;
  username: string;
}

export const accountSchema = z.object({
	firstName: z.string(),
	lastName: z.string(),
	role: z.string(),
	oauthToken: z.string(),
	repository: repositorySchema
})

export type Account = z.infer<typeof accountSchema>;

export type AuthContext = {
	userId: string;
	//oauthToken: string;
	user: User
};

export type Session = {
    auth: AuthContext,
	account: Account | undefined
} | {
	auth: AuthContext,
	account: Account
}

const getAccount = async (userId: string): Promise<Account | undefined> => {
	const account = await prisma.account.findFirst({
		where: {
			userId
		},
		include: {
			repository: true
		}
	});

	if (account === null) return undefined;

	return {
		firstName: account.firstName,
		lastName: account.lastName,
		repository: account.repository,
		role: account.role,
		oauthToken: account.oauthToken,
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
		//const oauthToken = await clerkClient.users.getUserOauthAccessToken(userId, 'oauth_github');
		ourAuth = {
			user: {
				id: user.id,
				name: `${user.firstName} ${user.lastName}`,
				image: user.imageUrl,
				username: user.username
			},
			userId,
			//oauthToken: oauthToken[0].token
		}
	}
	
	const account: Account | undefined = ourAuth ? (await getAccount(userId as string)) : undefined;

	return ourAuth ? {
		auth: ourAuth,
		account
	} : undefined
}
