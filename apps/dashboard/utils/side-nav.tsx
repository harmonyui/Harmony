'use client'
import { useClerk, UserButton } from '@clerk/nextjs'
import {
  DocumentDuplicateIcon,
  FolderIcon,
  UsersIcon,
} from '@harmony/ui/src/components/core/icons'
import type { SidePanelItems } from '@harmony/ui/src/components/core/side-panel'
import { SidePanel } from '@harmony/ui/src/components/core/side-panel'
import { usePathname } from 'next/navigation'
import { Workspace } from '@harmony/util/src/types/branch'
import { WorkspaceSwitcher } from './components/workspace-switcher'

interface SideNavProps {
  children: React.ReactNode
  workspaces?: Workspace[]
  currentWorkspaceId?: string
  teamId: string
}
export const SideNav: React.FunctionComponent<SideNavProps> = ({
  children,
  workspaces,
  currentWorkspaceId,
  teamId,
}) => {
  const { user } = useClerk()
  const pathname = usePathname()

  if (!user?.fullName) return

  const items: SidePanelItems[] = [
    {
      label: 'Projects',
      href: currentWorkspaceId
        ? `/${currentWorkspaceId}/projects`
        : '/projects',
      current: pathname.includes('projects'),
      icon: FolderIcon,
    },
    {
      label: 'Publish Requests',
      href: currentWorkspaceId
        ? `/${currentWorkspaceId}/pull-requests`
        : '/pull-requests',
      current: pathname.includes('pull-requests'),
      icon: DocumentDuplicateIcon,
    },
    {
      label: 'My Team',
      href: '/team',
      current: pathname.includes('team'),
      icon: UsersIcon,
    },
  ]

  return (
    <SidePanel
      items={items}
      title='Harmony'
      profileItem={
        <div className='flex gap-2 items-center'>
          <UserButton showName />
        </div>
      }
      workspaceSwitcher={
        workspaces && currentWorkspaceId ? (
          <WorkspaceSwitcher
            workspaces={workspaces}
            currentWorkspaceId={currentWorkspaceId}
            teamId={teamId}
          />
        ) : undefined
      }
    >
      {children}
    </SidePanel>
  )
}
