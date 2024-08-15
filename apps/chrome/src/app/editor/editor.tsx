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
import { StartModal } from './start-modal/start-modal'

export const EditorChrome: React.FunctionComponent = () => {
  const getToken = useCallback(() => {
    return new Promise<string>((resolve) => {
      chrome.runtime.sendMessage({ action: 'getToken' }, (token: string) => {
        resolve(token)
      })
    })
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

const useSendAuthentication = () => {
  const [tabId] = useQueryState<string>({ key: 'tabId' })

  useEffect(() => {
    window.addEventListener(
      'message',
      (event: MessageEvent<{ isSignedIn: boolean }>) => {
        if (
          event.data.isSignedIn &&
          window.location.origin === 'http://localhost:3000'
        ) {
          chrome.runtime.sendMessage(
            { action: 'setCookie', cookie: document.cookie, tabId },
            () => {
              console.log('cookie set')
              window.close()
            },
          )
          // chrome.storage.local.set({ cookie: document.cookie }, () => {
          //   console.log('cookie set')
          // })
        }
      },
    )
  }, [])
}

export const useAuthenticated = (callback: () => void) => {
  useEffect(() => {
    window.addEventListener('onAuthenticated', callback)
    return () => {
      window.removeEventListener('onAuthenticated', callback)
    }
  }, [callback])
}
