import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  useAuth,
} from '@clerk/clerk-react'
import { HarmonyModal } from '@harmony/ui/src/components/core/modal'
import { EDITOR_URL } from '@harmony/util/src/constants'
import type { ProjectDisplayProps } from '@harmony/ui/src/components/features/projects/project-display'
import { ProjectDisplay as ProjectDisplayPrimitive } from '@harmony/ui/src/components/features/projects/project-display'
import { useHarmonyStore } from 'harmony-ai-editor/src/components/hooks/state'
import { useEffect, useState } from 'react'
import type { BranchItem } from '@harmony/util/src/types/branch'
import { environment } from '@harmony/util/src/utils/component'

interface StartModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectProject: (branchId: string) => void
}
export const StartModal: React.FunctionComponent<StartModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
}) => {
  return (
    <HarmonyModal show={isOpen} onClose={onClose}>
      <div className='hw-flex hw-flex-col hw-justify-between hw-items-center hw-mb-4 hw-gap-4 hw-text-base'>
        <div className='hw-w-52 hw-h-12'>
          <img className='hw-w-full' src={`${EDITOR_URL}/Logo_navy.png`} />
        </div>
        <SignedOut>
          <SignInButton mode='modal' />
        </SignedOut>
        <SignedIn>
          <SignOutButton />
          <ProjectDisplay onOpenProject={(item) => onSelectProject(item.id)} />
        </SignedIn>
      </div>
    </HarmonyModal>
  )
}

const ProjectDisplay: React.FunctionComponent<
  Pick<ProjectDisplayProps, 'onOpenProject'>
> = ({ onOpenProject }) => {
  const client = useHarmonyStore((state) => state.client)
  const initializeDataLayer = useHarmonyStore(
    (state) => state.initializeDataLayer,
  )

  const [projects, setProjects] = useState<BranchItem[]>([])
  const { getToken } = useAuth()

  useEffect(() => {
    const initialize = async () => {
      if (client) {
        const data = await client.branch.getBranches.query()
        data && setProjects(data)
      } else {
        const token = await getToken()
        initializeDataLayer(environment, token)
      }
    }
    void initialize()
  }, [client])

  const onCreate: ProjectDisplayProps['onCreate'] = (
    item,
    { onFinish, onError },
  ): void => {
    client?.branch.createBranch
      .mutate({ branch: item })
      .then((data) => {
        onFinish(data)
        onOpenProject(data)
      })
      .catch(() => {
        onError('There was an error creating the project')
      })
  }

  const onDelete: ProjectDisplayProps['onDelete'] = (item) => {
    void client?.branch.deleteBranch.mutate({ branchId: item.id })
  }

  return (
    <ProjectDisplayPrimitive
      defaultUrl={window.location.origin}
      projects={projects}
      onCreate={onCreate}
      onDelete={onDelete}
      onOpenProject={onOpenProject}
    />
  )
}
