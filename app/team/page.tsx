import { Header } from "../../packages/ui/src/components/core/header";
import { NextPage } from "next";
import { SideNav } from "../../utils/side-nav";
import { withAuth } from "../../utils/protected-routes-hoc";
import { TeamDisplay } from "@harmony/ui/src/components/features/team";

const TeamPage = withAuth(async ({ctx}) => {
	const team = await ctx.prisma.team.findUnique({
		where: {
			id: ctx.session.account.teamId
		},
		include: {
			accounts: true
		}
	});
	if (!team) {
		throw new Error("Invalid team id " + ctx.session.account.teamId);
	}
	const members = team.accounts.map(account => ({
		id: account.id,
		name: `${account.firstName} ${account.lastName}`,
		role: account.role,
		contact: 'bradofrado@gmail.com'
	}))

	return (
		<SideNav>
			<TeamDisplay members={members}/>
		</SideNav>
	)
});

export default TeamPage;