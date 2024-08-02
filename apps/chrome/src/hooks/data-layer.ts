import { useAuth } from '@clerk/clerk-react'
import { environment } from '@harmony/util/src/utils/component'
import { useHarmonyStore } from 'harmony-ai-editor/src/components/hooks/state'
import { useEffect, useMemo } from 'react'

export const useDataLayer = () => {
  const client = useHarmonyStore((state) => state.client)
  const clientHasToken = useHarmonyStore((state) => state.clientHasToken)
  const initializeDataLayer = useHarmonyStore(
    (state) => state.initializeDataLayer,
  )

  const { getToken } = useAuth()

  useEffect(() => {
    const initialize = async () => {
      if (!client || !clientHasToken) {
        const token = await getToken()
        initializeDataLayer(environment, token || '')
      }
    }
    void initialize()
  }, [client, clientHasToken])

  const clientWithToken = useMemo(
    () => (clientHasToken ? client : undefined),
    [clientHasToken, client],
  )

  return clientWithToken
}
