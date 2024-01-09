import { z } from "zod";
import { createTRPCRouter, registerdProcedure } from "../trpc";
import { accountSchema } from "@harmony/server/auth";

export const setupRoute = createTRPCRouter({
	createRoute: registerdProcedure
		.input(z.object({account: accountSchema}))
		.mutation(async ({ctx, input}) => {
			const userId = ctx.session.auth?.userId;
			if (userId === undefined) {
				throw new Error("Invalid userId")
			}
			const newAccount = await ctx.prisma.account.create({
				data: {
					firstName: input.account.firstName,
					lastName: input.account.lastName,
					role: input.account.role,
					userId
				}
			});

			return {
				firstName: newAccount.firstName,
				lastName: newAccount.lastName,
				role: newAccount.role
			}
		})
})