import { useAuth } from '@clerk/clerk-react'
import { environment } from '@harmony/util/src/utils/component'
import { useHarmonyStore } from 'harmony-ai-editor/src/components/hooks/state'
import { useEffect } from 'react'

export const useDataLayer = () => {
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
