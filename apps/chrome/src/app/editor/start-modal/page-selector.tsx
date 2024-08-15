import { useMemo, useState } from 'react'
import { CreateOrSelectPage } from './pages/create-or-select'
import { CreateProjectPage } from './pages/create-project'
import { SelectProjectsPage } from './pages/select-projects'
import type { StartPageComponent, StartPageType } from './types'

const pages: Record<StartPageType, StartPageComponent> = {
  createOrSelect: CreateOrSelectPage,
  createProject: CreateProjectPage,
  selectProject: SelectProjectsPage,
}
export const PageSelector: React.FunctionComponent<{
  onOpenProject: (projectId: string) => void
}> = ({ onOpenProject }) => {
  const [page, setPage] = useState<StartPageType>('createOrSelect')

  const CurrComponent = useMemo(() => pages[page], [page])
  return <CurrComponent setPage={setPage} onOpenProject={onOpenProject} />
}
