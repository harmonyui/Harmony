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
import ReactDOM from 'react-dom'
import { MemoryRouter } from 'react-router-dom'

const Popup: React.FunctionComponent = () => {
  const [tabId] = useQueryStorageState<string>({
    key: 'tabId',
  })

  return (
    <ClerkProvider publishableKey={process.env.CLERK_PUBLISHABLE_KEY || ''}>
      <main className='App-main'>
        <SignedOut>
          <SignIn fallbackRedirectUrl='/popup.html' />
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
  const { getToken } = useAuth()
  const handleSignInSuccess = (token: string) => {
    // Store authenticated status
    chrome.storage.local.set({ token }, () => {
      chrome.tabs.sendMessage(
        tabId ? parseInt(tabId) : 0,
        { action: 'extensionIconClicked', token },
        (response) => {
          console.log('response', response)
        },
      )
      chrome.tabs.update(tabId ? parseInt(tabId) : 0, { active: true })
      window.close() // Close the popup after successful sign-in
    })
  }

  useEffect(() => {
    const initialize = async () => {
      const token = await getToken()
      handleSignInSuccess(token || '')
    }
    void initialize()
  }, [])

  return <></>
}

ReactDOM.render(
  <React.StrictMode>
    <MemoryRouter>
      <QueryStateProvider>
        <Popup />
      </QueryStateProvider>
    </MemoryRouter>
  </React.StrictMode>,
  document.getElementById('popup-root'),
)
