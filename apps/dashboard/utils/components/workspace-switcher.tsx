'use client'

import { Popover } from '@harmony/ui/src/components/core/popover'
import {
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
} from '@harmony/ui/src/components/core/icons'
import { Button } from '@harmony/ui/src/components/core/button'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WorkspaceCreationModal } from './workspace-creation-modal'
import { Workspace } from '@harmony/util/src/types/branch'

interface WorkspaceSwitcherProps {
  workspaces: Workspace[]
  currentWorkspaceId: string
  teamId: string
}

export const WorkspaceSwitcher: React.FunctionComponent<
  WorkspaceSwitcherProps
> = ({ workspaces, currentWorkspaceId, teamId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId)

  return (
    <>
      <Popover
        button={
          <Button
            mode='none'
            className='flex items-center gap-2 hover:bg-gray-700 px-2 py-1 rounded-md'
          >
            <div className='flex flex-col text-left'>
              <span className='font-medium text-white text-sm'>
                {currentWorkspace?.name}
              </span>
              {currentWorkspace?.repository && (
                <span className='text-sm text-gray-500'>
                  {currentWorkspace.repository.name}
                </span>
              )}
            </div>
            <ChevronDownIcon className='dark:text-white text-gray-900 size-4' />
          </Button>
        }
      >
        <div className='flex flex-col gap-2 p-2 min-w-[200px]'>
          <div className='flex items-center justify-between'>
            <span className='font-medium'>Workspaces</span>
            <Button
              mode='none'
              size='sm'
              onClick={() => {
                setIsModalOpen(true)
              }}
            >
              <PlusIcon className='h-4 w-4' />
            </Button>
          </div>
          <div className='flex flex-col gap-1'>
            {workspaces
              .slice()
              .sort((a) => (a.id === currentWorkspaceId ? -1 : 1))
              .map((workspace) => (
                <Button
                  key={workspace.id}
                  mode='none'
                  className='flex items-center gap-2 hover:bg-gray-200 px-2 py-1 rounded-md'
                  onClick={() => {
                    router.push(`/${workspace.id}/projects`)
                  }}
                >
                  <div className='flex flex-col items-start'>
                    <span className='font-medium'>{workspace.name}</span>
                    {workspace.repository && (
                      <span className='text-sm text-gray-500'>
                        {workspace.repository.name}
                      </span>
                    )}
                  </div>
                  {workspace.id === currentWorkspaceId && (
                    <CheckIcon className='h-4 w-4' />
                  )}
                </Button>
              ))}
          </div>
        </div>
      </Popover>

      <WorkspaceCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        teamId={teamId}
      />
    </>
  )
}
