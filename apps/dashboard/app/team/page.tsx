import { SideNav } from "../../utils/side-nav";
import { withAuth } from "../../utils/protected-routes-hoc";
import { emailSchema } from "@harmony/util/src/types/utils";
import { TeamMember } from "@harmony/util/src/types/branch";
import { TeamDisplay } from "./components/team";

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
	const members: TeamMember[] = team.accounts.map(account => ({
		id: account.id,
		name: `${account.firstName} ${account.lastName}`,
		role: account.role,
		contact: emailSchema.parse(account.contact)
	}))

	return (
		<SideNav>
			<TeamDisplay members={members}/>
		</SideNav>
	)
});

export default TeamPage;