//import { useAuth } from '@clerk/clerk-react'
import { environment } from '@harmony/util/src/utils/component'
import { useHarmonyStore } from 'harmony-ai-editor/src/components/hooks/state'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

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
  const client = useHarmonyStore((state) => state.client)
  const initializeDataLayer = useHarmonyStore(
    (state) => state.initializeDataLayer,
  )

  useEffect(() => {
    const initialize = async () => {
      if (!client) {
        initializeDataLayer(environment, getToken)
      }
    }
    void initialize()
  }, [client, getToken])

  return (
    <DataLayerContext.Provider value={{ client }}>
      {children}
    </DataLayerContext.Provider>
  )
}

export const useDataLayer = () => {
  return useContext(DataLayerContext)
}
