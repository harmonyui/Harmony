import { NextPage } from "next";
import { SideNav } from "../../utils/side-nav";
import { BranchDisplay, BranchLineItem } from "@harmony/components/features/branch";
import {  ModalProvider } from "@harmony/components/core/modal";
import React from "react";
import { withAuth } from "@harmony/utils/protected-routes-hoc";
import { prisma } from "@harmony/server/db";
import { getBranches } from "@harmony/server/api/routers/branch";
import { GithubRepository } from "@harmony/server/api/repository/github";

const BranchPage = withAuth(async ({session}) => {
	const branches = await getBranches({prisma, githubRepository: new GithubRepository(session.account.repository)})

	return (
		<ModalProvider>
			<SideNav>
				<BranchDisplay branches={branches}/>
			</SideNav>
		</ModalProvider>
	)
});
export default BranchPage;