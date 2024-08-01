export type StartPageType = 'createOrSelect' | 'createProject' | 'selectProject'
export type StartPageComponent = React.FunctionComponent<{
  setPage: (page: StartPageType) => void
  onOpenProject: (projectId: string) => void
}>
