import { NextPage } from "next";
import { SideNav } from "../../utils/side-nav";
import { BranchDisplay, BranchLineItem } from "@harmony/components/features/branch";
import {  ModalProvider } from "@harmony/components/core/modal";
import React from "react";
import { withAuth } from "@harmony/utils/protected-routes-hoc";
import { prisma } from "@harmony/server/db";

const BranchPage: NextPage = withAuth(async () => {
	const branches = await prisma.branch.findMany();

	return (
		<ModalProvider>
			<SideNav>
				<BranchDisplay branches={branches}/>
			</SideNav>
		</ModalProvider>
	)
});
export default BranchPage;