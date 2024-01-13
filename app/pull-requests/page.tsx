import { Header } from "@harmony/components/core/header";
import { NextPage } from "next";
import { SideNav } from "../../utils/side-nav";
import { withAuth } from "@harmony/utils/protected-routes-hoc";
import { prisma } from "@harmony/server/db";
import { ModalProvider } from "@harmony/components/core/modal";
import { PullRequestDisplay } from "@harmony/components/features/pull-request";

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