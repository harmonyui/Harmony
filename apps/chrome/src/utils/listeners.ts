import {
  ActionHandler,
  Actions,
  PayloadForAction,
  ReturnTypeForAction,
} from './actions'

export const setupExtensionIconClickedListener = (
  callback: (tabId: number) => Promise<void>,
) => {
  chrome.action.onClicked.addListener((tab) => {
    if (!tab.id) return

    void callback(tab.id)
  })
}

export const sendInitEditorMessage = (tabId: number) => {
  void chrome.tabs.sendMessage(tabId, { action: Actions.InitEditor, tabId })
}

export const createTab = (url: string) => {
  void chrome.tabs.create({ url })
}

export const updateActiveTab = (tabId: number) => {
  void chrome.tabs.update(tabId, { active: true })
}

export const removeTab = (tabId: number) => {
  void chrome.tabs.remove(tabId)
}

type ActionMessage = {
  [K in Actions]: {
    action: K
    handler: ActionHandler<K>
  }
}[Actions]

export const setupMessageListeners = (messages: ActionMessage[]) => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { action, ...payload } = message
    const handler = messages.find((m) => m.action === action)?.handler

    if (handler) {
      void handler(payload).then((result) => sendResponse(result))
    }

    return true
  })
}

type SendMessageOptions<T extends Actions> =
  PayloadForAction<T> extends undefined
    ? { action: T; payload?: undefined }
    : { action: T; payload: PayloadForAction<T> }

export const sendMessage = <T extends Actions>({
  action,
  payload,
}: SendMessageOptions<T>): Promise<ReturnTypeForAction<T>> => {
  return new Promise<ReturnTypeForAction<T>>((resolve) => {
    chrome.runtime.sendMessage(
      { action, ...payload },
      (ret: ReturnTypeForAction<T>) => {
        resolve(ret)
      },
    )
  })
}
