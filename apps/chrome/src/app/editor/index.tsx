import { TOGGLE_EVENT } from 'harmony-ai-editor/src/hooks/toggle-event'
import { EditorChrome } from './editor'
import { createRoot } from 'react-dom/client'
import { Actions } from '../../utils/helpers'

const harmonyEntryPoint = document.createElement('div')
harmonyEntryPoint.id = 'harmony'
document.querySelector('body')?.appendChild(harmonyEntryPoint)

const root = createRoot(harmonyEntryPoint)
root.render(<EditorChrome />)

chrome.runtime.onMessage.addListener(
  (request: { action: string; token: string }, sender, sendResponse) => {
    if (request.action === Actions.InitEditor) {
      window.dispatchEvent(
        new CustomEvent(TOGGLE_EVENT, { detail: request.token }),
      )
      sendResponse({ status: 'action performed' })
    }
  },
)
