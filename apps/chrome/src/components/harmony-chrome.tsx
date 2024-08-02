import { environment } from '@harmony/util/src/utils/component'
import { useHarmonySetup } from 'harmony-ai-editor/src'
import 'harmony-ai-editor/src/global.css'
import { useCallback, useState } from 'react'
import {
  QueryStateProvider,
  useQueryState,
} from '@harmony/ui/src/hooks/query-state'
import { ClerkProvider } from '@clerk/clerk-react'
import { useToggleEvent } from 'harmony-ai-editor/src/components/hooks/toggle-event'
import { StartModal } from './start-modal/start-modal'

export const HarmonyChrome: React.FunctionComponent = () => {
  return (
    <QueryStateProvider>
      <ClerkProvider publishableKey={process.env.CLERK_PUBLISHABLE_KEY || ''}>
        <HarmonyChromeWithProviders />
      </ClerkProvider>
    </QueryStateProvider>
  )
}

const HarmonyChromeWithProviders: React.FunctionComponent = () => {
  const [branchId, setBranchId] = useQueryState<string>({ key: 'branch-id' })
  const [showStartModal, setShowStartModal] = useQueryState({
    key: 'start-modal',
    defaultValue: false,
  })
  const [token, setToken] = useState<string | null>(null)

  const onToggleEditor = useCallback(() => {
    if (branchId === undefined) {
      setShowStartModal(true)
    } else {
      setBranchId(undefined)
    }
  }, [setBranchId, setShowStartModal, branchId])

  const onSelectProject = useCallback((_branchId: string) => {
    setShowStartModal(false)
    setBranchId(_branchId)
  }, [])

  useToggleEvent(onToggleEditor)

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
