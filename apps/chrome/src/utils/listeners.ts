/* eslint-disable @typescript-eslint/no-explicit-any -- ok */
import { Actions } from './helpers'

export const setupExtensionIconClickedListener = (
  callback: (tabId: number) => Promise<void>,
) => {
  chrome.action.onClicked.addListener((tab) => {
    if (!tab.id) return

    void callback(tab.id)
  })
}

export const sendInitEditorMessage = (tabId: number) => {
  void chrome.tabs.sendMessage(tabId, { action: Actions.InitEditor })
}

export const createTab = (url: string) => {
  void chrome.tabs.create({ url })
}

export const updateActiveTab = (tabId: number) => {
  void chrome.tabs.update(tabId, { active: true })
}

interface Message {
  action: string
  handler: (payload: any) => Promise<any>
}
export const setupMessageListeners = (messages: Message[]) => {
  chrome.runtime.onMessage.addListener(
    (message: { action: string } & object, sender, sendResponse) => {
      const handler = messages.find((m) => m.action === message.action)?.handler

      if (handler) {
        void handler({ ...message, action: undefined }).then((result) =>
          sendResponse(result),
        )
      }

      return true
    },
  )
}

export const sendMessage = <R>({
  action,
  payload,
}: {
  action: string
  payload?: any
}): Promise<R> => {
  return new Promise<R>((resolve) => {
    chrome.runtime.sendMessage({ action, ...payload }, (ret: R) => {
      resolve(ret)
    })
  })
}
