import { environment } from '@harmony/util/src/utils/component'
import { useHarmonySetup } from 'harmony-ai-editor/src'
import 'harmony-ai-editor/src/global.css'
import { useCallback, useEffect } from 'react'
import {
  QueryStateProvider,
  useQueryState,
} from '@harmony/ui/src/hooks/query-state'
import { useToggleEvent } from 'harmony-ai-editor/src/components/hooks/toggle-event'
import { DataLayerProvider, useDataLayer } from '../hooks/data-layer'
import { StartModal } from './start-modal/start-modal'

export const HarmonyChrome: React.FunctionComponent = () => {
  return (
    <QueryStateProvider>
      <DataLayerProvider>
        <HarmonyChromeWithProviders />
      </DataLayerProvider>
    </QueryStateProvider>
  )
}

const HarmonyChromeWithProviders: React.FunctionComponent = () => {
  const [branchId, setBranchId] = useQueryState<string>({ key: 'branch-id' })
  const [showStartModal, setShowStartModal] = useQueryState({
    key: 'start-modal',
    defaultValue: false,
  })
  const { setToken } = useDataLayer()

  const onToggleEditor = useCallback(
    (e: CustomEventInit<string>) => {
      const token = e.detail
      if (token) {
        setToken(token)
      }
      if (branchId === undefined) {
        setShowStartModal(true)
      } else {
        setBranchId(undefined)
      }
    },
    [setBranchId, setShowStartModal, branchId],
  )

  const onSelectProject = useCallback((_branchId: string) => {
    setShowStartModal(false)
    setBranchId(_branchId)
  }, [])

  useToggleEvent(onToggleEditor)

  useAuthenticated(() => {
    setShowStartModal(true)
  })

  useHarmonySetup(
    {
      local: true,
      repositoryId: undefined,
      overlay: true,
      show: Boolean(branchId),
      environment,
    },
    branchId,
  )

  return (
    <StartModal
      isOpen={showStartModal}
      onClose={() => setShowStartModal(false)}
      onSelectProject={onSelectProject}
    />
  )
}

export const useAuthenticated = (callback: () => void) => {
  useEffect(() => {
    window.addEventListener('onAuthenticated', callback)
    return () => {
      window.removeEventListener('onAuthenticated', callback)
    }
  }, [callback])
}
