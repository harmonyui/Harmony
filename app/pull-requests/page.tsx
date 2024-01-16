import { Header } from "../../src/components/core/header";
import { NextPage } from "next";
import { SideNav } from "../../utils/side-nav";
import { withAuth } from "../../utils/protected-routes-hoc";
import { prisma } from "../../src/server/db";
import { ModalProvider } from "../../src/components/core/modal";
import { PullRequestDisplay } from "../../src/components/features/pull-request";

const PullRequestPage = withAuth(async () => {
	const pullRequests = await prisma.pullRequest.findMany();

	return (
		<ModalProvider>
			<SideNav>
				<PullRequestDisplay items={pullRequests}/>
			</SideNav>
		</ModalProvider>
	)
});

export default PullRequestPage;