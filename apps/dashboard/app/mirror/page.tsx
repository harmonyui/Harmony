"use server"
import { withAuth } from "../../utils/protected-routes-hoc";
import { redirect } from "next/navigation";
import { TeamMirrorDisplay } from "../team/components/team";


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