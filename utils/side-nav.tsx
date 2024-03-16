'use client'
import { useClerk } from "@clerk/nextjs";
import { ToggleIcon, GitBranchIcon, GitPullRequestIcon, UserGroupIcon } from "../packages/ui/src/components/core/icons"
import { SidePanelItems, SidePanel, ProfileItem } from "../packages/ui/src/components/core/side-panel"
import { useRouter } from "next/navigation";

interface SideNavProps {
	children: React.ReactNode
}
export const SideNav: React.FunctionComponent<SideNavProps> = ({children}) => {
	const {user, signOut} = useClerk();
	const router = useRouter();

	if (!user || !user.fullName) return;

	const items: SidePanelItems[] = [
		{
			label: 'Projects',
			href: '/projects',
			current: window.location.href.includes('projects'),
			icon: GitBranchIcon
		},
		{
			label: 'Publish Requests',
			href: '/pull-requests',
			current: window.location.href.includes('pull-requests'),
			icon: GitPullRequestIcon
		},
		{
			label: 'My Team',
			href: '/team',
			current: window.location.href.includes('team'),
			icon: UserGroupIcon
		}
	];
	const profileItem: ProfileItem = {
		name: user.firstName || user.fullName,
		img: user.imageUrl,
		navigation: [
			{
				name: 'Sign Out',
				onClick() {
					signOut(() => router.push('/'))
				}
			}
		]
	}
	return (
			<SidePanel items={items} title="Harmony" profileItem={profileItem}>
				{children}
			</SidePanel>
	)
}