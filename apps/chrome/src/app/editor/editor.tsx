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
import { Actions } from '../../utils/actions'
import { sendMessage } from '../../utils/listeners'
import { useToggleEnable } from 'harmony-ai-editor/src/hooks/toggle-enable'
import { HarmonyProviderFunc } from 'harmony-ai-editor/src/global-provider'
import { useBranchId } from 'harmony-ai-editor/src/hooks/branch-id'
import { User } from 'harmony-ai-editor/src/utils/types'
import { LoginModal } from './login-modal'
import { AuthUrl } from '../../utils/auth-url'

export const EditorChrome: React.FunctionComponent = () => {
  return (
    <QueryStateProvider>
      <EditorChromeAfterProviders />
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
  const [chromeTabId, setChromeTabId] = useStorageState<number>({
    key: 'chromeTabId',
    storage: 'local',
  })
  const [_environment] = useQueryState<Environment | undefined>({
    key: 'harmony-environment',
  })
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useSendAuthentication()

  const onToggleEditor = useCallback(
    (e: CustomEventInit<number>) => {
      setChrome(!chrome)
      if (e.detail) {
        setChromeTabId(e.detail)
      }
      if (chrome) {
        cleanup()
        setBranchId(undefined)
      }
    },
    [setChrome, chrome],
  )

  useToggleEvent(onToggleEditor)

  useToggleEnable()

  const tryGetUser = useCallback(async () => {
    const user = await sendMessage<Actions.GetUser>({
      action: Actions.GetUser,
    })
    setUser(user)
    if (user) {
      setShowLoginModal(false)
    } else {
      setShowLoginModal(true)
    }
  }, [setShowLoginModal, setUser])

  const getToken = useCallback(async () => {
    const token = await sendMessage<Actions.GetToken>({
      action: Actions.GetToken,
    })
    if (!token) {
      // Reset the cookie so that getting the user will fail, triggering the login modal
      await sendMessage<Actions.SetCookie>({
        action: Actions.SetCookie,
        payload: {
          cookie: document.cookie,
        },
      })
      setShowLoginModal(true)
      return ''
    }
    return token
  }, [])

  useEffect(() => {
    if (!chromeTabId || !chrome) return

    tryGetUser()
  }, [tryGetUser, chromeTabId, chrome])

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
    <DataLayerProvider getToken={getToken}>
      {chromeTabId ? (
        <LoginModal
          show={showLoginModal}
          tabId={chromeTabId}
          onTryAgain={tryGetUser}
        />
      ) : null}
    </DataLayerProvider>
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
          void sendMessage<Actions.SetCookie>({
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
