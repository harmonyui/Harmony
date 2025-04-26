import { environment } from '@harmony/util/src/utils/component'
import type { ActionsPayload } from '../../utils/helpers'
import { Actions, AuthUrl, Clerk, Storage } from '../../utils/helpers'
import {
  createTab,
  sendInitEditorMessage,
  setupExtensionIconClickedListener,
  setupMessageListeners,
  updateActiveTab,
} from '../../utils/listeners'

setupExtensionIconClickedListener(async (tabId) => {
  const cookie = await Storage.getCookie()

  if (cookie) {
    sendInitEditorMessage(tabId)
  } else {
    createTab(AuthUrl.getAuthUrl(environment, tabId))
  }
})

setupMessageListeners([
  {
    action: Actions.GetToken,
    handler: async () => {
      const cookie = await Storage.getCookie()

      if (!cookie) throw new Error('No cookie found')

      return Clerk.getToken(cookie)
    },
  },
  {
    action: Actions.SetCookie,
    handler: async ({ cookie, tabId }: ActionsPayload.SetCookie) => {
      await Storage.setCookie(cookie)

      sendInitEditorMessage(tabId)
      updateActiveTab(tabId)
    },
  },
  {
    action: Actions.GetUser,
    handler: async () => {
      const cookie = await Storage.getCookie()

      if (!cookie) throw new Error('No cookie found')

      return Clerk.getUser(cookie)
    },
  },
])
