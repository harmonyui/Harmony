import { SideNav } from "../../utils/side-nav";
import {  ModalProvider } from "@harmony/ui/src/components/core/modal";
import React, { useRef } from "react";
import { withAuth } from "../../utils/protected-routes-hoc";
import { getBranches } from "../../src/server/api/routers/branch";
import { ProjectDisplay } from "@harmony/ui/src/components/features/project";


const ProjectsPage = withAuth(async ({ctx}) => {
	const branches = ctx.session.account.repository ? await getBranches({prisma: ctx.prisma, repositoryId: ctx.session.account.repository.id, accountId: ctx.session.account.id}) : undefined;

	return (
		<ModalProvider>
			<SideNav>
				{branches ? <ProjectDisplay Projectes={branches} defaultUrl={ctx.session.account.repository!.defaultUrl}/> : <div>
					No Repositories
				</div>}
				{/* <SnappingDemo/> */}
			</SideNav>
		</ModalProvider>
	)
});

export default ProjectsPage;