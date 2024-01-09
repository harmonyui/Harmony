import { auth, clerkClient } from "@clerk/nextjs";
import { getAuth } from '@clerk/nextjs/server';
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { prisma } from "./db";

export interface User {
  id: string;
  name: string;
  image: string;
}

export const accountSchema = z.object({
	firstName: z.string(),
	lastName: z.string(),
	role: z.string()
})

export type Account = z.infer<typeof accountSchema>;

export type AuthContext = {
	userId: string;
	user: User
} | null;

export interface Session {
  auth: AuthContext,
	account: Account | undefined
}

const getAccount = async (userId: string): Promise<Account | undefined> => {
	return (await prisma.account.findFirst({
		where: {
			userId
		},
		select: {
			firstName: true,
			lastName: true,
			role: true
		}
	})) ?? undefined
}

export const getServerAuthSession = async (): Promise<Session | undefined> => {
	const {userId} = auth();
	const user = userId ? await clerkClient.users.getUser(userId) : undefined;
	const ourAuth = !userId || !user ? null : {userId, user: {id: user.id, name: `${user.firstName} ${user.lastName}`, image: user.imageUrl}}
	
	const account: Account | undefined = ourAuth ? (await getAccount(userId)) : undefined;

	return {
		auth: ourAuth,
		account
	}
}
