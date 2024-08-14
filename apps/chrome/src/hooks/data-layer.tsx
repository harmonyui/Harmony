//import { useAuth } from '@clerk/clerk-react'
import { environment } from '@harmony/util/src/utils/component'
import { useHarmonyStore } from 'harmony-ai-editor/src/components/hooks/state'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type ClientType = Parameters<Parameters<typeof useHarmonyStore>[0]>[0]['client']

interface DataLayerState {
  setToken: (token: string) => void
  client: ClientType | undefined
}
const DataLayerContext = createContext<DataLayerState>({
  setToken: () => undefined,
  client: undefined,
})

export const DataLayerProvider: React.FunctionComponent<{
  children: React.ReactNode
}> = ({ children }) => {
  const client = useHarmonyStore((state) => state.client)
  const clientHasToken = useHarmonyStore((state) => state.clientHasToken)
  const initializeDataLayer = useHarmonyStore(
    (state) => state.initializeDataLayer,
  )
  const [token, setToken] = useState<string>()

  useEffect(() => {
    const initialize = async () => {
      if ((!client || !clientHasToken) && token) {
        initializeDataLayer(environment, token)
      }
    }
    void initialize()
  }, [client, clientHasToken, token])

  const clientWithToken = useMemo(
    () => (clientHasToken ? client : undefined),
    [clientHasToken, client],
  )

  return (
    <DataLayerContext.Provider value={{ client: clientWithToken, setToken }}>
      {children}
    </DataLayerContext.Provider>
  )
}

export const useDataLayer = () => {
  return useContext(DataLayerContext)
}
