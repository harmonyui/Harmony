//import { useAuth } from '@clerk/clerk-react'
import { useQueryState } from '@harmony/ui/src/hooks/query-state'
import { Environment, environment } from '@harmony/util/src/utils/component'
import { useBranchId } from 'harmony-ai-editor/src/hooks/branch-id'
import { useHarmonyStore } from 'harmony-ai-editor/src/hooks/state'
import { getRepositoryId } from 'harmony-ai-editor/src/utils/get-repository-id'
import { createContext, useCallback, useContext, useEffect } from 'react'

type ClientType = Parameters<Parameters<typeof useHarmonyStore>[0]>[0]['client']

interface DataLayerState {
  client: ClientType | undefined
}
const DataLayerContext = createContext<DataLayerState>({
  client: undefined,
})

export const DataLayerProvider: React.FunctionComponent<{
  children: React.ReactNode
  getToken: () => Promise<string>
}> = ({ children, getToken }) => {
  const { branchId } = useBranchId()
  const [currentEnvironment] = useQueryState<Environment>({
    key: 'harmony-environment',
  })

  const client = useHarmonyStore((state) => state.client)
  const dayLayerState = useHarmonyStore((state) => state.initializeDataLayer)

  const initializeDataLayer = useCallback(() => {
    dayLayerState(
      currentEnvironment ?? environment,
      getToken,
      branchId === 'local',
      getRepositoryId() ?? '',
    )
  }, [branchId, getToken, currentEnvironment])

  useEffect(() => {
    initializeDataLayer()
  }, [branchId, currentEnvironment])

  return (
    <DataLayerContext.Provider value={{ client }}>
      {children}
    </DataLayerContext.Provider>
  )
}

export const useDataLayer = () => {
  return useContext(DataLayerContext)
}
