import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignIn,
  useAuth,
} from '@clerk/chrome-extension'
import { QueryStateProvider } from '@harmony/ui/src/hooks/query-state'
import { useQueryStorageState } from '@harmony/ui/src/hooks/query-storage-state'
import React, { useEffect } from 'react'
import 'chrome'

export const AuthPage: React.FunctionComponent = () => {
  return (
    <QueryStateProvider>
      <AuthPageAfterProviders />
    </QueryStateProvider>
  )
}

const AuthPageAfterProviders: React.FunctionComponent = () => {
  const [tabId] = useQueryStorageState<string>({
    key: 'tabId',
  })

  return (
    <ClerkProvider publishableKey={process.env.CLERK_PUBLISHABLE_KEY || ''}>
      <main className='App-main'>
        <SignedOut>
          <SignIn fallbackRedirectUrl='/auth.html' />
        </SignedOut>
        <SignedIn>
          <AfterSignIn tabId={tabId} />
        </SignedIn>
      </main>
    </ClerkProvider>
  )
}

interface AfterSignInProps {
  tabId: string | undefined
}
const AfterSignIn: React.FunctionComponent<AfterSignInProps> = ({ tabId }) => {
  const { sessionId } = useAuth()
  const handleSignInSuccess = (_sessionId: string) => {
    // Store authenticated status
    chrome.storage.local.set({ sessionId: _sessionId }, () => {
      chrome.tabs.sendMessage(
        tabId ? parseInt(tabId) : 0,
        { action: 'extensionIconClicked' },
        (response) => {
          console.log('response', response)
        },
      )
      void chrome.tabs.update(tabId ? parseInt(tabId) : 0, { active: true })
      window.close() // Close the popup after successful sign-in
    })
  }

  useEffect(() => {
    const initialize = async () => {
      //const token = await getToken()
      handleSignInSuccess(sessionId || '')
    }
    void initialize()
  }, [])

  return <></>
}
