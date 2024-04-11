import { notFound, redirect } from "next/navigation";
import { getServerAuthSession } from "../../../src/server/auth";
import { requireAuth } from "../../../utils/protected-routes-hoc";
import { prisma } from "../../../src/server/db";
import { createNewAccount } from "../../../src/server/api/routers/setup";
import { createBranch, getBranches } from "../../../src/server/api/routers/branch";
import { DesignerSetup } from "@harmony/ui/src/components/features/setup";
import { wordToKebabCase } from "@harmony/util/src";

async function QuickPage({searchParams}: {searchParams?: { [key: string]: string | string[] | undefined }}) {
    const teamId = searchParams?.teamId || undefined;

	if (teamId && typeof teamId === 'string') {
		const team = await prisma.team.findUnique({
			where: {
				id: teamId
			}
		});
		if (!team) {
			notFound();
		}
	}

	if (teamId && typeof teamId !== 'string') {
		notFound();
	}

    const session = await getServerAuthSession();
    if (!session) {
        notFound();
    }

    if (!session.account) {
        const account = await createNewAccount({prisma, account: {
            firstName: session.auth.user.name,
            lastName: session.auth.user.name,
            role: 'quick'
        }, userId: session.auth.userId, teamId, email: session.auth.user.email});
        session.account = account;
    }

    if (!session.account.repository) {
        return <DesignerSetup teamId={session.account.teamId}/>
    }

    const repositoryId = session.account.repository.id;
    const accountId = session.account.id;
    const branches = await getBranches({prisma, repositoryId, accountId});
    let firstBranch = branches[0];
    if (!firstBranch) {
        const newBranch = await createBranch({prisma, branch: {
            id: '',
            label: session.auth.user.name,
            name: wordToKebabCase(session.auth.user.name),
            commits: [],
            lastUpdated: new Date(),
            url: session.account.repository.defaultUrl
        }, repositoryId, accountId});
        firstBranch = newBranch;
    }


    const url = new URL(`${firstBranch.url}`);
    url.searchParams.append('branch-id', firstBranch.id);
    redirect(url.href)
}

export default QuickPage;