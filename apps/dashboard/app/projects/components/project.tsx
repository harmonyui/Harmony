import type { ProjectDisplayProps } from '@harmony/ui/src/components/features/projects/project-display'
import { ProjectDisplay as ProjectDisplayPrimitive } from '@harmony/ui/src/components/features/projects/project-display'
import type { BranchItem } from '@harmony/util/src/types/branch'
import { useRouter } from 'next/navigation'
import { createUrlFromProject } from '@harmony/util/src/utils/component'
import { api } from '../../../utils/api'

export const ProjectDisplay: React.FunctionComponent<
  Pick<ProjectDisplayProps, 'projects' | 'defaultUrl'>
> = ({ projects, defaultUrl }) => {
  const { mutate: deleteItem } = api.branch.deleteBranch.useMutation()
  const { mutate } = api.branch.createBranch.useMutation()

  const router = useRouter()

  const onCreate: ProjectDisplayProps['onCreate'] = (
    item: BranchItem,
    { onFinish, onError },
  ): void => {
    mutate(
      { branch: item },
      {
        onSuccess(data) {
          onFinish(data)
          onOpenProject(data)
        },
        onError() {
          onError('There was an error creating the project')
        },
      },
    )
  }

  const onDelete = (item: BranchItem): void => {
    deleteItem(
      { branchId: item.id },
      {
        onSuccess() {
          router.refresh()
        },
      },
    )
  }

  const onOpenProject = (item: BranchItem): void => {
    const url = createUrlFromProject(item)
    window.location.replace(url.href)
  }

  return (
    <ProjectDisplayPrimitive
      defaultUrl={defaultUrl}
      projects={projects}
      onCreate={onCreate}
      onDelete={onDelete}
      onOpenProject={onOpenProject}
    />
  )
}
