import { useSearchParams, useRouter, notFound } from "next/navigation";
import React, { useState } from "react";
import { WelcomeDisplay } from "@harmony/ui/src/components/features/setup";
import { prisma } from "../../src/server/db";

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

	return <WelcomeDisplay teamId={teamId}/>
}