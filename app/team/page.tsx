import { Header } from "../../packages/ui/src/components/core/header";
import { NextPage } from "next";
import { SideNav } from "../../utils/side-nav";
import { withAuth } from "../../utils/protected-routes-hoc";

const TeamPage = withAuth(() => {
	return (
		<SideNav>
			<Header level={2}>Team Page Coming Soon!</Header>
		</SideNav>
	)
});

export default TeamPage;