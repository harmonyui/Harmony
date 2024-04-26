import { withAuth } from "../../../../utils/protected-routes-hoc"
import { SideNav } from "../../../../utils/side-nav"

const MirrorLayout = ({
    children,
  }: {
    children: React.ReactNode
}) => {
    return <SideNav>
        {children}
    </SideNav>
};

export default MirrorLayout