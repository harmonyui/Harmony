import { EditorChrome } from './editor'
import { createRoot } from 'react-dom/client'
import { actionHandlers, Actions } from '../../utils/actions'
import { setupMessageListeners } from '../../utils/listeners'

const harmonyEntryPoint = document.createElement('div')
harmonyEntryPoint.id = 'harmony'
document.querySelector('body')?.appendChild(harmonyEntryPoint)

const root = createRoot(harmonyEntryPoint)
root.render(<EditorChrome />)

setupMessageListeners([
  {
    action: Actions.InitEditor,
    handler: actionHandlers[Actions.InitEditor],
  },
])
