import { ToggleIcon, GitBranchIcon, GitPullRequestIcon, UserGroupIcon } from "@harmony/components/core/icons"
import { SidePanelItems, SidePanel } from "@harmony/components/core/side-panel"

export const SideNav: React.FunctionComponent<React.PropsWithChildren> = ({children}) => {
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
	]
  return (
		<SidePanel items={items} title="Harmony">
			{children}
		</SidePanel>
  )
}