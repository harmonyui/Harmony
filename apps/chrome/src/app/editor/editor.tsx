import { Environment, environment } from '@harmony/util/src/utils/component'
import { useHarmonySetup } from 'harmony-ai-editor/src/components/harmony-setup'
import 'harmony-ai-editor/src/global.css'
import { useCallback, useEffect, useState } from 'react'
import {
  QueryStateProvider,
  useQueryState,
} from '@harmony/ui/src/hooks/query-state'
import { useStorageState } from '@harmony/ui/src/hooks/storage-state'
import { useToggleEvent } from 'harmony-ai-editor/src/hooks/toggle-event'
import { DataLayerProvider } from '../../hooks/data-layer'
import type { ActionsPayload } from '../../utils/helpers'
import { Actions, AuthUrl } from '../../utils/helpers'
import { sendMessage } from '../../utils/listeners'
import { StartModal } from './start-modal/start-modal'
import { useToggleEnable } from 'harmony-ai-editor/src/hooks/toggle-enable'
import { HarmonyProviderFunc } from 'harmony-ai-editor/src/global-provider'
import { useBranchId } from 'harmony-ai-editor/src/hooks/branch-id'
import { User } from 'harmony-ai-editor/src/utils/types'

export const EditorChrome: React.FunctionComponent = () => {
  const getToken = useCallback(async () => {
    console.log('getToken')
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
  const { branchId, setBranchId } = useBranchId()

  const [chrome, setChrome] = useStorageState({
    key: 'chrome',
    defaultValue: false,
    storage: 'local',
  })
  const [_environment] = useQueryState<Environment | undefined>({
    key: 'harmony-environment',
  })
  const [showStartModal, setShowStartModal] = useState(false)
  const [user, setUser] = useState<User | undefined>(undefined)

  useSendAuthentication()

  const onToggleEditor = useCallback(() => {
    setChrome(!chrome)
    if (chrome) {
      cleanup()
      setBranchId(undefined)
    }
  }, [setChrome, chrome])

  const onSelectProject = useCallback((_branchId: string) => {
    setShowStartModal(false)
    setBranchId({ name: 'Local', id: _branchId, label: _branchId })
    setChrome(true)
  }, [])

  useToggleEvent(onToggleEditor)

  useToggleEnable()

  useEffect(() => {
    sendMessage<object, User>({
      action: Actions.GetUser,
    }).then((user) => {
      console.log('got user')
      console.log(user)
      setUser(user)
    })
  }, [setUser])

  const cleanup = useHarmonySetup(
    {
      local: true,
      repositoryId: undefined,
      overlay: true,
      show: chrome,
      environment: _environment || environment,
      initShow: chrome,
      user: user as User,
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

if (typeof window !== 'undefined') {
  window.HarmonyProvider = HarmonyProviderFunc
}
