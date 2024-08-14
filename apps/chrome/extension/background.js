/*global chrome -- ok*/
chrome.action.onClicked.addListener((tab) => {
  chrome.storage.local.get('token', ({ token }) => {
    if (token) {
      chrome.tabs.sendMessage(tab.id, { action: 'extensionIconClicked', token })
    } else {
      chrome.tabs.create({
        url: `${chrome.runtime.getURL('popup.html')}?tabId=${tab.id}`,
      })
    }
  })
})
