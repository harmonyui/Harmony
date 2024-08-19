import { environment } from '@harmony/util/src/utils/component'
import { useHarmonySetup } from 'harmony-ai-editor/src'
import 'harmony-ai-editor/src/global.css'
import { useCallback, useEffect } from 'react'
import {
  QueryStateProvider,
  useQueryState,
} from '@harmony/ui/src/hooks/query-state'
import { useToggleEvent } from 'harmony-ai-editor/src/components/hooks/toggle-event'
import { DataLayerProvider } from '../../hooks/data-layer'
import type { ActionsPayload } from '../../utils/helpers'
import { Actions, AuthUrl } from '../../utils/helpers'
import { sendMessage } from '../../utils/listeners'
import { StartModal } from './start-modal/start-modal'

export const EditorChrome: React.FunctionComponent = () => {
  const getToken = useCallback(async () => {
    const token = await sendMessage<object, string>({
      action: Actions.GetToken,
    })
    return token
  }, [])

  return (
    <QueryStateProvider>
      <DataLayerProvider getToken={getToken}>
        <EditorChromeAfterProviders />
      </DataLayerProvider>
    </QueryStateProvider>
  )
}

const EditorChromeAfterProviders: React.FunctionComponent = () => {
  const [branchId, setBranchId] = useQueryState<string>({ key: 'branch-id' })
  const [showStartModal, setShowStartModal] = useQueryState({
    key: 'start-modal',
    defaultValue: false,
  })

  useSendAuthentication()

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

const useSendAuthentication = () => {
  const [tabId] = useQueryState<string>({ key: 'tabId' })

  useEffect(() => {
    window.addEventListener(
      'message',
      (event: MessageEvent<{ isSignedIn: boolean }>) => {
        if (
          event.data.isSignedIn &&
          window.location.origin === AuthUrl.getAuthUrlBase(environment)
        ) {
          void sendMessage<ActionsPayload.SetCookie, undefined>({
            action: Actions.SetCookie,
            payload: {
              cookie: document.cookie,
              tabId: parseInt(tabId || '0'),
            },
          }).then(() => {
            console.log('cookie set')
            window.close()
          })
        }
      },
    )
  }, [])
}