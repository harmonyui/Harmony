import { notFound } from "next/navigation";
import React from "react";
import { prisma } from "@harmony/db/lib/prisma";
import { getServerAuthSession } from "@harmony/server/src/auth";
import { cookies } from "next/headers";
import { WelcomeDisplay } from "./components/setup";

export default async function SetupPage({searchParams}: {searchParams?: { [key: string]: string | string[] | undefined }}) {
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

	const cookie = cookies();
	const auth = await getServerAuthSession(cookie.get('harmony-user-id')?.value);

	return <WelcomeDisplay teamId={teamId} account={auth?.account}/>
}