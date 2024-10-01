'use client'
import { useClerk, UserButton, UserProfile } from '@clerk/nextjs'
import {
  DocumentDuplicateIcon,
  FolderIcon,
  GitBranchIcon,
  GitPullRequestIcon,
  UserGroupIcon,
  UsersIcon,
} from '@harmony/ui/src/components/core/icons'
import type {
  SidePanelItems,
  ProfileItem,
} from '@harmony/ui/src/components/core/side-panel'
import { SidePanel } from '@harmony/ui/src/components/core/side-panel'
import { useRouter, usePathname } from 'next/navigation'

interface SideNavProps {
  children: React.ReactNode
}
export const SideNav: React.FunctionComponent<SideNavProps> = ({
  children,
}) => {
  const { user, signOut } = useClerk()
  const router = useRouter()
  const pathname = usePathname()

  if (!user?.fullName) return

  const items: SidePanelItems[] = [
    {
      label: 'Projects',
      href: '/projects',
      current: pathname.includes('projects'),
      icon: FolderIcon,
    },
    {
      label: 'Publish Requests',
      href: '/pull-requests',
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
  const profileItem: ProfileItem = {
    name: user.firstName || user.fullName,
    img: user.imageUrl,
    navigation: [
      {
        name: 'Sign Out',
        onClick() {
          void signOut(() => {
            router.push('/')
          })
        },
      },
    ],
  }
  return (
    <SidePanel
      items={items}
      title='Harmony'
      profileItem={
        <div className='hw-flex hw-gap-2 hw-items-center'>
          <UserButton showName />
          {/* {user.fullName} */}
        </div>
      }
    >
      {children}
    </SidePanel>
  )
}
