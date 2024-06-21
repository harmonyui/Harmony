import { Header } from "@harmony/ui/src/components/core/header";
import { SideNav } from "../../utils/side-nav";
import { withAuth } from "../../utils/protected-routes-hoc";

const SettingsPage = withAuth(() => {
  return (
    <SideNav>
      <Header level={2}>Settings Page Coming Soon!</Header>
    </SideNav>
  );
});

export default SettingsPage;
