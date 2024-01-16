import { NextPage } from "next";
import { SideNav } from "../../utils/side-nav";
import { withAuth } from "../../utils/protected-routes-hoc";
import { Header } from "../../src/components/core/header";

const SettingsPage = withAuth(() => {
	return (
		<SideNav>
			<Header level={2}>Settings Page Coming Soon!</Header>
		</SideNav>
	)
});

export default SettingsPage;