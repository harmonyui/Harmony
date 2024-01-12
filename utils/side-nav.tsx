'use client'
import { useClerk } from "@clerk/nextjs";
import { ToggleIcon, GitBranchIcon, GitPullRequestIcon, UserGroupIcon } from "@harmony/components/core/icons"
import { SidePanelItems, SidePanel, ProfileItem } from "@harmony/components/core/side-panel"
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
			label: 'My Branches',
			href: '/branch',
			current: true,
			icon: <ToggleIcon icon={GitBranchIcon} selected={true}/>
		},
		{
			label: 'Pull Requests',
			href: '/pull-requests',
			current: false,
			icon: <ToggleIcon icon={GitPullRequestIcon} selected={true}/>
		},
		{
			label: 'My Team',
			href: '/team',
			current: false,
			icon: <ToggleIcon icon={UserGroupIcon} selected={true}/>
		}
	];
  const profileItem: ProfileItem = {
	name: user.fullName,
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