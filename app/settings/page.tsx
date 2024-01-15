import { Header } from "@harmony/components/core/header";
import { NextPage } from "next";
import { SideNav } from "../../utils/side-nav";
import { withAuth } from "@harmony/utils/protected-routes-hoc";

const SettingsPage = withAuth(() => {
	return (
		<SideNav>
			<Header level={2}>Settings Page Coming Soon!</Header>
		</SideNav>
	)
});

export default SettingsPage;