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
import { useEffect, useMemo, useState } from 'react'
import type { BranchItem } from '@harmony/util/src/types/branch'
import { environment } from '@harmony/util/src/utils/component'
import { Button } from '@harmony/ui/src/components/core/button'
import { Label } from '@harmony/ui/src/components/core/label'
import { Input } from '@harmony/ui/src/components/core/input'
import { wordToKebabCase } from '@harmony/util/src/utils/common'

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
    <HarmonyModal
      show={isOpen}
      onClose={onClose}
      maxWidthClassName='hw-w-[32rem]'
    >
      <div className='hw-flex hw-flex-col hw-justify-between hw-items-center hw-mb-4 hw-gap-6 hw-text-base'>
        <div className='hw-w-52 hw-h-12'>
          <img className='hw-w-full' src={`${EDITOR_URL}/Logo_navy.png`} />
        </div>
        <SignedOut>
          <SignInButton mode='modal' />
        </SignedOut>
        <SignedIn>
          <div className='hw-w-full'>
            <StartMain onOpenProject={onSelectProject} />
          </div>
        </SignedIn>
      </div>
    </HarmonyModal>
  )
}

type StartPageType = 'createOrSelect' | 'createProject' | 'selectProject'
type StartPageComponent = React.FunctionComponent<{
  setPage: (page: StartPageType) => void
  onOpenProject: (projectId: string) => void
}>
const pages: Record<StartPageType, StartPageComponent> = {
  createOrSelect: ({ setPage }) => {
    return (
      <div className='hw-flex hw-flex-col hw-gap-2 hw-items-center'>
        <Button onClick={() => setPage('createProject')}>Create Project</Button>
        <span>or</span>
        <Button onClick={() => setPage('selectProject')}>Select Project</Button>
      </div>
    )
  },
  createProject: ({ onOpenProject }) => {
    const [projectName, setProjectName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const client = useDataLayer()

    const onCreate = (): void => {
      const url = new URL(window.location.href)
      url.search = ''
      const branch: BranchItem = {
        id: '',
        label: projectName,
        name: wordToKebabCase(projectName),
        url: url.href,
        commits: [],
        lastUpdated: new Date(),
      }
      setLoading(true)
      client?.branch.createBranch
        .mutate({ branch })
        .then((data) => {
          onOpenProject(data.id)
          setLoading(false)
        })
        .catch(() => {
          setError('There was an error creating the project')
          setLoading(false)
        })
    }

    return (
      <div className='hw-flex hw-flex-col hw-gap-4'>
        <Label label='Project Name'>
          <Input
            className='hw-w-full'
            value={projectName}
            onChange={setProjectName}
          />
        </Label>
        <div>
          {error ? (
            <p className='hw-text-red-400 hw-text-sm hw-mb-1'>{error}</p>
          ) : null}
          <Button
            className='hw-w-full'
            disabled={!projectName}
            onClick={onCreate}
            loading={loading}
          >
            Create Project
          </Button>
        </div>
      </div>
    )
  },
  selectProject: () => <div>Hello</div>,
}

const StartMain: React.FunctionComponent<{
  onOpenProject: (projectId: string) => void
}> = ({ onOpenProject }) => {
  const [page, setPage] = useState<StartPageType>('createOrSelect')

  const CurrComponent = useMemo(() => pages[page], [page])
  return <CurrComponent setPage={setPage} onOpenProject={onOpenProject} />
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

const useDataLayer = () => {
  const client = useHarmonyStore((state) => state.client)
  const initializeDataLayer = useHarmonyStore(
    (state) => state.initializeDataLayer,
  )

  const { getToken } = useAuth()

  useEffect(() => {
    const initialize = async () => {
      if (!client) {
        const token = await getToken()
        initializeDataLayer(environment, token)
      }
    }
    void initialize()
  }, [client])

  return client
}
