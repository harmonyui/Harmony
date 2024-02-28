"use server"
import { TableGrid, TableGridColumn } from "@harmony/ui/src/components/core/table-grid";
import { prisma } from "../../src/server/db";
import { withAuth } from "../../utils/protected-routes-hoc";
import { TeamMirrorDisplay } from "@harmony/ui/src/components/features/team";
import { SideNav } from "../../utils/side-nav";
import { redirect } from "next/navigation";


const MirrorPage = withAuth(async ({ctx}) => {
    if (ctx.session.auth.role !== 'harmony-admin') {
        redirect('/');
    }

    const accounts = await ctx.prisma.account.findMany({
        // where: {
        //     team_id: ctx.session.account.teamId
        // }
    });
    const mirrorAccounts = accounts.map(account => ({firstName: account.firstName, lastName: account.lastName, role: account.role, link: `/?mirror-id=${account.userId}`}));
    return <TeamMirrorDisplay accounts={mirrorAccounts}/>
});

export default MirrorPage;