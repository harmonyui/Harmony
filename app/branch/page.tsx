import { NextPage } from "next";
import { SideNav } from "../../utils/side-nav";
import { BranchDisplay, BranchLineItem } from "../../src/components/features/branch";
import {  ModalProvider } from "../../src/components/core/modal";
import React from "react";
import { withAuth } from "../../utils/protected-routes-hoc";
import { prisma } from "../../src/server/db";
import { getBranches } from "../../src/server/api/routers/branch";
import { GithubRepository } from "../../src/server/api/repository/github";
import { createTRPCContext } from "../../src/server/api/trpc";

const BranchPage = withAuth(async ({ctx}) => {
	const branches = await getBranches(ctx, new GithubRepository(ctx.session.account.repository));

	return (
		<ModalProvider>
			<SideNav>
				<BranchDisplay branches={branches}/>
			</SideNav>
		</ModalProvider>
	)
});
export default BranchPage;