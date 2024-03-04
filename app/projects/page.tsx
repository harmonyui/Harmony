import { NextPage } from "next";
import { SideNav } from "../../utils/side-nav";
import { BranchDisplay, BranchLineItem } from "@harmony/ui/src/components/features/branch";
import {  ModalProvider } from "@harmony/ui/src/components/core/modal";
import React, { useRef } from "react";
import { withAuth } from "../../utils/protected-routes-hoc";
import { prisma } from "../../src/server/db";
import { getBranches } from "../../src/server/api/routers/branch";
import { GithubRepository } from "../../src/server/api/repository/github";
import { createTRPCContext } from "../../src/server/api/trpc";
import CodeSnippet from "@harmony/ui/src/components/core/code-snippet";
import { ElementDemo, FlexBoxDemo, SnappingDemo } from "../../utils/flex-demo";
import { ProjectDisplay } from "@harmony/ui/src/components/features/project";


const ProjectsPage = withAuth(async ({ctx}) => {
	const branches = ctx.session.account.repository ? await getBranches({prisma: ctx.prisma, repositoryId: ctx.session.account.repository.id}, new GithubRepository(ctx.session.account.repository)) : undefined;

	return (
		<ModalProvider>
			<SideNav>
				{branches ? <ProjectDisplay Projectes={branches}/> : <div>
					No Repositories
				</div>}
				{/* <SnappingDemo/> */}
			</SideNav>
		</ModalProvider>
	)
});

export default ProjectsPage;