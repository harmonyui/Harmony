import { actionHandlers, Actions } from '../../utils/actions'
import {
  sendInitEditorMessage,
  setupExtensionIconClickedListener,
  setupMessageListeners,
} from '../../utils/listeners'

setupExtensionIconClickedListener(async (tabId) => {
  sendInitEditorMessage(tabId)
})

setupMessageListeners([
  {
    action: Actions.GetToken,
    handler: actionHandlers[Actions.GetToken],
  },
  {
    action: Actions.SetCookie,
    handler: actionHandlers[Actions.SetCookie],
  },
  {
    action: Actions.GetUser,
    handler: actionHandlers[Actions.GetUser],
  },
  {
    action: Actions.AuthTab,
    handler: actionHandlers[Actions.AuthTab],
  },
])
