import { useAuth } from '@clerk/clerk-react'
import type { ProjectDisplayProps } from '@harmony/ui/src/components/features/projects/project-display'
import { ProjectDisplay } from '@harmony/ui/src/components/features/projects/project-display'
import type { BranchItem } from '@harmony/util/src/types/branch'
import { environment } from '@harmony/util/src/utils/component'
import { useHarmonyStore } from 'harmony-ai-editor/src/components/hooks/state'
import { useState, useEffect } from 'react'
import type { StartPageComponent } from '../types'

export const SelectProjectsPage: StartPageComponent = ({ onOpenProject }) => {
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
        onOpenProject(data.id)
      })
      .catch(() => {
        onError('There was an error creating the project')
      })
  }

  const onDelete: ProjectDisplayProps['onDelete'] = (item) => {
    void client?.branch.deleteBranch.mutate({ branchId: item.id })
  }

  return (
    <ProjectDisplay
      defaultUrl={window.location.origin}
      projects={projects}
      onCreate={onCreate}
      onDelete={onDelete}
      onOpenProject={(item) => onOpenProject(item.id)}
    />
  )
}
