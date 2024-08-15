import ReactDOM from 'react-dom'
import { EditorChrome } from './editor'

const harmonyEntryPoint = document.createElement('div')
harmonyEntryPoint.id = 'harmony'
document.querySelector('body')?.appendChild(harmonyEntryPoint)

ReactDOM.render(<EditorChrome />, document.getElementById('harmony'))

chrome.runtime.onMessage.addListener(
  (request: { action: string; token: string }, sender, sendResponse) => {
    if (request.action === 'extensionIconClicked') {
      window.dispatchEvent(
        new CustomEvent('toggleEditor', { detail: request.token }),
      )
      sendResponse({ status: 'action performed' })
    }
  },
)
